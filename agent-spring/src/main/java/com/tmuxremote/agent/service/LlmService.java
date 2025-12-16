package com.tmuxremote.agent.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tmuxremote.agent.dto.AgentConfig;
import lombok.extern.slf4j.Slf4j;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Slf4j
public class LlmService {

    private final AgentConfig.LlmConfig config;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient;

    public LlmService(AgentConfig.LlmConfig config) {
        this.config = config != null ? config : new AgentConfig.LlmConfig();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();
    }

    public Map<String, Object> chat(String model, List<Map<String, Object>> messages,
                                     Double temperature, Integer maxTokens, Boolean stream) {
        if (!config.isEnabled()) {
            return Map.of(
                    "error", Map.of(
                            "message", "LLM is disabled on this agent",
                            "type", "service_unavailable"
                    )
            );
        }

        String provider = config.getProvider() != null ? config.getProvider() : "ollama";
        String actualModel = model != null ? model : config.getModel();

        try {
            return switch (provider.toLowerCase()) {
                case "ollama" -> callOllama(actualModel, messages, temperature, maxTokens);
                case "openai" -> callOpenAi(actualModel, messages, temperature, maxTokens);
                default -> Map.of(
                        "error", Map.of(
                                "message", "Unknown LLM provider: " + provider,
                                "type", "invalid_request"
                        )
                );
            };
        } catch (Exception e) {
            log.error("LLM call failed", e);
            return Map.of(
                    "error", Map.of(
                            "message", e.getMessage(),
                            "type", "internal_error"
                    )
            );
        }
    }

    private Map<String, Object> callOllama(String model, List<Map<String, Object>> messages,
                                            Double temperature, Integer maxTokens) throws Exception {
        String baseUrl = config.getBaseUrl() != null ? config.getBaseUrl() : "http://localhost:11434";

        // Convert to Ollama format
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", messages);
        requestBody.put("stream", false);

        Map<String, Object> options = new HashMap<>();
        if (temperature != null) {
            options.put("temperature", temperature);
        }
        if (maxTokens != null) {
            options.put("num_predict", maxTokens);
        }
        if (!options.isEmpty()) {
            requestBody.put("options", options);
        }

        String requestJson = objectMapper.writeValueAsString(requestBody);
        log.debug("Ollama request: {}", requestJson);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/chat"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                .timeout(Duration.ofMinutes(5))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.error("Ollama error: status={}, body={}", response.statusCode(), response.body());
            return Map.of(
                    "error", Map.of(
                            "message", "Ollama returned status " + response.statusCode(),
                            "type", "api_error"
                    )
            );
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> ollamaResponse = objectMapper.readValue(response.body(), Map.class);

        // Convert to OpenAI compatible format
        return convertOllamaToOpenAiFormat(ollamaResponse, model);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> convertOllamaToOpenAiFormat(Map<String, Object> ollamaResponse, String model) {
        Map<String, Object> message = (Map<String, Object>) ollamaResponse.get("message");
        String content = message != null ? (String) message.get("content") : "";

        Map<String, Object> choice = new HashMap<>();
        choice.put("index", 0);
        choice.put("message", Map.of(
                "role", "assistant",
                "content", content
        ));
        choice.put("finish_reason", "stop");

        Map<String, Object> usage = new HashMap<>();
        if (ollamaResponse.containsKey("prompt_eval_count")) {
            usage.put("prompt_tokens", ollamaResponse.get("prompt_eval_count"));
        }
        if (ollamaResponse.containsKey("eval_count")) {
            usage.put("completion_tokens", ollamaResponse.get("eval_count"));
        }
        usage.put("total_tokens",
                ((Number) usage.getOrDefault("prompt_tokens", 0)).intValue() +
                        ((Number) usage.getOrDefault("completion_tokens", 0)).intValue()
        );

        Map<String, Object> result = new HashMap<>();
        result.put("id", "chatcmpl-" + UUID.randomUUID().toString().substring(0, 8));
        result.put("object", "chat.completion");
        result.put("created", System.currentTimeMillis() / 1000);
        result.put("model", model);
        result.put("choices", List.of(choice));
        result.put("usage", usage);

        return result;
    }

    private Map<String, Object> callOpenAi(String model, List<Map<String, Object>> messages,
                                            Double temperature, Integer maxTokens) throws Exception {
        String baseUrl = config.getBaseUrl() != null ? config.getBaseUrl() : "https://api.openai.com/v1";
        String apiKey = config.getApiKey();

        if (apiKey == null || apiKey.isEmpty()) {
            return Map.of(
                    "error", Map.of(
                            "message", "OpenAI API key not configured",
                            "type", "configuration_error"
                    )
            );
        }

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", messages);
        if (temperature != null) {
            requestBody.put("temperature", temperature);
        }
        if (maxTokens != null) {
            requestBody.put("max_tokens", maxTokens);
        }

        String requestJson = objectMapper.writeValueAsString(requestBody);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/chat/completions"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                .timeout(Duration.ofMinutes(5))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.error("OpenAI error: status={}, body={}", response.statusCode(), response.body());
            return Map.of(
                    "error", Map.of(
                            "message", "OpenAI returned status " + response.statusCode(),
                            "type", "api_error"
                    )
            );
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> result = objectMapper.readValue(response.body(), Map.class);
        return result;
    }
}

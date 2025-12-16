package com.tmuxremote.agent.client;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tmuxremote.agent.dto.AgentConfig;
import com.tmuxremote.agent.dto.Message;
import com.tmuxremote.agent.service.CommandExecutionService;
import com.tmuxremote.agent.service.LlmService;
import lombok.extern.slf4j.Slf4j;
import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * WebSocket client for handling API requests (exec, llm_chat)
 * Registers with agentId for API routing
 */
@Slf4j
public class ApiWebSocketClient extends WebSocketClient {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AgentConfig.ApiConfig apiConfig;
    private final String machineId;
    private final String agentToken;
    private final CommandExecutionService commandService;
    private final LlmService llmService;

    private final AtomicBoolean isConnected = new AtomicBoolean(false);
    private final AtomicInteger reconnectAttempts = new AtomicInteger(0);
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

    private static final int MAX_RECONNECT_DELAY_MS = 30000;
    private static final int BASE_RECONNECT_DELAY_MS = 1000;

    public ApiWebSocketClient(URI serverUri, AgentConfig.ApiConfig apiConfig,
                               String machineId, String agentToken) {
        super(serverUri);
        this.apiConfig = apiConfig;
        this.machineId = machineId;
        this.agentToken = agentToken;
        this.commandService = new CommandExecutionService(apiConfig.getExec());
        this.llmService = new LlmService(apiConfig.getLlm());
    }

    @Override
    public void onOpen(ServerHandshake handshake) {
        log.info("API WebSocket connected for agent: {}", apiConfig.getAgentId());
        isConnected.set(true);
        reconnectAttempts.set(0);
        registerAsApiAgent();
    }

    @Override
    public void onMessage(String message) {
        try {
            Message msg = objectMapper.readValue(message, Message.class);
            log.debug("API message received: type={}", msg.getType());

            switch (msg.getType()) {
                case "exec" -> handleExec(msg);
                case "llm_chat" -> handleLlmChat(msg);
                case "send_keys" -> handleSendKeys(msg);
                case "list_sessions" -> handleListSessions(msg);
                default -> log.debug("Ignoring message type: {}", msg.getType());
            }
        } catch (Exception e) {
            log.error("Failed to process API message", e);
        }
    }

    @Override
    public void onClose(int code, String reason, boolean remote) {
        log.warn("API WebSocket disconnected: code={}, reason={}, remote={}",
                code, reason, remote);
        isConnected.set(false);
        scheduleReconnect();
    }

    @Override
    public void onError(Exception ex) {
        log.error("API WebSocket error", ex);
    }

    private void registerAsApiAgent() {
        try {
            Map<String, String> meta = new HashMap<>();
            meta.put("machineId", machineId);
            meta.put("agentId", apiConfig.getAgentId());
            if (agentToken != null && !agentToken.isEmpty()) {
                meta.put("token", agentToken);
            }

            Message registerMsg = Message.builder()
                    .type("register")
                    .role("host")
                    .session("api-" + apiConfig.getAgentId())
                    .meta(meta)
                    .build();

            String json = objectMapper.writeValueAsString(registerMsg);
            send(json);
            log.info("Registered as API agent: agentId={}", apiConfig.getAgentId());
        } catch (Exception e) {
            log.error("Failed to register as API agent", e);
        }
    }

    private void handleExec(Message msg) {
        Map<String, String> meta = msg.getMeta();
        if (meta == null) {
            log.warn("exec message missing meta");
            return;
        }

        String requestId = meta.get("requestId");
        if (requestId == null) {
            log.warn("exec message missing requestId");
            return;
        }

        try {
            // Parse payload
            String payloadStr = meta.get("payload");
            @SuppressWarnings("unchecked")
            Map<String, Object> payload = payloadStr != null
                    ? objectMapper.readValue(payloadStr, Map.class)
                    : Map.of();

            String command = (String) payload.get("command");
            String cwd = (String) payload.get("cwd");
            Integer timeout = payload.get("timeout") != null
                    ? ((Number) payload.get("timeout")).intValue()
                    : null;
            String sessionId = (String) payload.get("sessionId");

            log.info("Executing command: cmd={}, cwd={}, timeout={}", command, cwd, timeout);

            // Execute command
            Map<String, Object> result = commandService.executeCommand(command, cwd, timeout, sessionId);

            // Send response
            sendApiResponse(requestId, result);

        } catch (Exception e) {
            log.error("Failed to handle exec", e);
            sendApiResponse(requestId, Map.of(
                    "exitCode", -1,
                    "stdout", "",
                    "stderr", "Error: " + e.getMessage(),
                    "duration", 0
            ));
        }
    }

    @SuppressWarnings("unchecked")
    private void handleLlmChat(Message msg) {
        Map<String, String> meta = msg.getMeta();
        if (meta == null) {
            log.warn("llm_chat message missing meta");
            return;
        }

        String requestId = meta.get("requestId");
        if (requestId == null) {
            log.warn("llm_chat message missing requestId");
            return;
        }

        try {
            // Parse payload
            String payloadStr = meta.get("payload");
            Map<String, Object> payload = payloadStr != null
                    ? objectMapper.readValue(payloadStr, Map.class)
                    : Map.of();

            String model = (String) payload.get("model");
            List<Map<String, Object>> messages = (List<Map<String, Object>>) payload.get("messages");
            Double temperature = payload.get("temperature") != null
                    ? ((Number) payload.get("temperature")).doubleValue()
                    : null;
            Integer maxTokens = payload.get("max_tokens") != null
                    ? ((Number) payload.get("max_tokens")).intValue()
                    : null;
            Boolean stream = (Boolean) payload.get("stream");

            log.info("LLM chat request: model={}, messages={}", model, messages != null ? messages.size() : 0);

            // Call LLM
            Map<String, Object> result = llmService.chat(model, messages, temperature, maxTokens, stream);

            // Send response
            sendApiResponse(requestId, result);

        } catch (Exception e) {
            log.error("Failed to handle llm_chat", e);
            sendApiResponse(requestId, Map.of(
                    "error", Map.of(
                            "message", e.getMessage(),
                            "type", "internal_error"
                    )
            ));
        }
    }

    @SuppressWarnings("unchecked")
    private void handleSendKeys(Message msg) {
        Map<String, String> meta = msg.getMeta();
        if (meta == null) {
            log.warn("send_keys message missing meta");
            return;
        }

        String requestId = meta.get("requestId");
        if (requestId == null) {
            log.warn("send_keys message missing requestId");
            return;
        }

        try {
            // Parse payload
            String payloadStr = meta.get("payload");
            Map<String, Object> payload = payloadStr != null
                    ? objectMapper.readValue(payloadStr, Map.class)
                    : Map.of();

            String target = (String) payload.get("target");
            String keys = (String) payload.get("keys");
            Boolean enter = payload.get("enter") != null
                    ? (Boolean) payload.get("enter")
                    : true;

            if (target == null || keys == null) {
                sendApiResponse(requestId, Map.of(
                        "success", false,
                        "error", "target and keys are required"
                ));
                return;
            }

            log.info("Sending keys to tmux: target={}, keys={}, enter={}", target, keys, enter);

            // Build tmux send-keys command
            ProcessBuilder pb;
            if (enter) {
                pb = new ProcessBuilder("tmux", "send-keys", "-t", target, keys, "Enter");
            } else {
                pb = new ProcessBuilder("tmux", "send-keys", "-t", target, keys);
            }
            pb.redirectErrorStream(true);

            Process process = pb.start();
            int exitCode = process.waitFor();

            String output = new String(process.getInputStream().readAllBytes());

            if (exitCode == 0) {
                sendApiResponse(requestId, Map.of(
                        "success", true,
                        "target", target
                ));
            } else {
                sendApiResponse(requestId, Map.of(
                        "success", false,
                        "error", output.isEmpty() ? "tmux send-keys failed" : output.trim()
                ));
            }

        } catch (Exception e) {
            log.error("Failed to handle send_keys", e);
            sendApiResponse(requestId, Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    private void handleListSessions(Message msg) {
        Map<String, String> meta = msg.getMeta();
        if (meta == null) {
            log.warn("list_sessions message missing meta");
            return;
        }

        String requestId = meta.get("requestId");
        if (requestId == null) {
            log.warn("list_sessions message missing requestId");
            return;
        }

        try {
            log.info("Listing tmux sessions");

            // Execute tmux list-sessions with format
            ProcessBuilder pb = new ProcessBuilder(
                    "tmux", "list-sessions", "-F",
                    "#{session_name}|#{session_windows}|#{session_created}|#{session_attached}"
            );
            pb.redirectErrorStream(true);

            Process process = pb.start();
            String output = new String(process.getInputStream().readAllBytes());
            int exitCode = process.waitFor();

            if (exitCode == 0) {
                List<Map<String, Object>> sessions = new java.util.ArrayList<>();

                for (String line : output.trim().split("\n")) {
                    if (line.isEmpty()) continue;

                    String[] parts = line.split("\\|");
                    if (parts.length >= 4) {
                        Map<String, Object> session = new HashMap<>();
                        session.put("name", parts[0]);
                        session.put("windows", Integer.parseInt(parts[1]));
                        session.put("created", parts[2]);
                        session.put("attached", "1".equals(parts[3]));
                        sessions.add(session);
                    }
                }

                sendApiResponse(requestId, Map.of(
                        "sessions", sessions
                ));
            } else {
                // No sessions or tmux not running
                sendApiResponse(requestId, Map.of(
                        "sessions", List.of(),
                        "message", output.trim()
                ));
            }

        } catch (Exception e) {
            log.error("Failed to handle list_sessions", e);
            sendApiResponse(requestId, Map.of(
                    "sessions", List.of(),
                    "error", e.getMessage()
            ));
        }
    }

    private void sendApiResponse(String requestId, Map<String, Object> response) {
        try {
            String payloadJson = objectMapper.writeValueAsString(response);

            Message responseMsg = Message.builder()
                    .type("api_response")
                    .meta(Map.of(
                            "requestId", requestId,
                            "payload", payloadJson
                    ))
                    .build();

            String json = objectMapper.writeValueAsString(responseMsg);
            if (isConnected.get() && isOpen()) {
                send(json);
                log.debug("Sent API response for requestId={}", requestId);
            }
        } catch (Exception e) {
            log.error("Failed to send API response", e);
        }
    }

    private void scheduleReconnect() {
        int attempts = reconnectAttempts.incrementAndGet();
        int delay = calculateBackoffDelay(attempts);

        log.info("Scheduling API reconnect in {} ms (attempt {})", delay, attempts);

        scheduler.schedule(() -> {
            try {
                if (!isConnected.get()) {
                    log.info("Attempting API reconnect...");
                    reconnect();
                }
            } catch (Exception e) {
                log.error("API reconnect failed", e);
                scheduleReconnect();
            }
        }, delay, TimeUnit.MILLISECONDS);
    }

    private int calculateBackoffDelay(int attempts) {
        int delay = (int) Math.min(
                BASE_RECONNECT_DELAY_MS * Math.pow(2, attempts - 1),
                MAX_RECONNECT_DELAY_MS
        );
        int jitter = (int) (Math.random() * delay * 0.5);
        return delay + jitter;
    }

    public void connectWithJitter() {
        int jitter = (int) (Math.random() * 2000);
        log.info("Scheduling API connect in {} ms", jitter);
        scheduler.schedule(() -> {
            try {
                connect();
            } catch (Exception e) {
                log.error("API initial connect failed", e);
                scheduleReconnect();
            }
        }, jitter, TimeUnit.MILLISECONDS);
    }

    public void shutdown() {
        scheduler.shutdown();
        if (commandService != null) {
            commandService.shutdown();
        }
        try {
            closeBlocking();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    public boolean isConnected() {
        return isConnected.get();
    }
}

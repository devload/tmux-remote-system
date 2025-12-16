package com.tmuxremote.relay.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
public class GeminiService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final int timeoutSeconds;

    public GeminiService(
            @Value("${gemini.api.key:}") String apiKey,
            @Value("${gemini.api.url}") String apiUrl,
            @Value("${gemini.api.timeout-seconds:30}") int timeoutSeconds,
            ObjectMapper objectMapper) {
        this.apiKey = apiKey;
        this.timeoutSeconds = timeoutSeconds;
        this.objectMapper = objectMapper;
        this.webClient = WebClient.builder()
                .baseUrl(apiUrl)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isEmpty();
    }

    /**
     * Get AI move for Connect4 game (multiplayer support)
     * @param board 6x7 board state (board[row][col] = {player: "player"|"ai1"|"ai2"|"ai3", value: 1-10} or null)
     * @param aiCard Current AI card value (1-10)
     * @param aiPlayerId Which AI is playing ("ai1", "ai2", "ai3")
     * @param totalPlayers Total number of players in the game (2, 3, or 4)
     * @return int[] {row, col} or null if failed
     */
    public int[] getConnect4Move(Object[][] board, int aiCard, String aiPlayerId, int totalPlayers) {
        if (!isConfigured()) {
            log.warn("Gemini API key not configured");
            return null;
        }

        String prompt = buildConnect4Prompt(board, aiCard, aiPlayerId, totalPlayers);
        log.debug("Gemini prompt for {}: {}", aiPlayerId, prompt);

        try {
            String response = callGemini(prompt);
            log.debug("Gemini response: {}", response);
            return parseConnect4Response(response);
        } catch (Exception e) {
            log.error("Failed to get Gemini response", e);
            return null;
        }
    }

    private String buildConnect4Prompt(Object[][] board, int aiCard, String aiPlayerId, int totalPlayers) {
        StringBuilder sb = new StringBuilder();

        sb.append("You are playing Card Connect 4 (").append(totalPlayers).append(" players). Rules:\n");
        sb.append("- 6 rows (0-5, bottom to top) x 7 columns (0-6)\n");
        sb.append("- Place cards anywhere, not just bottom\n");
        sb.append("- Higher cards can cover lower cards\n");
        sb.append("- First to get 4 in a row wins\n\n");

        // Build player legend based on total players
        sb.append("Players: P=Human");
        for (int i = 1; i < totalPlayers; i++) {
            sb.append(", ").append(i).append("=AI").append(i);
        }
        sb.append("\n\n");

        sb.append("Current board (row 5 is top, row 0 is bottom):\n");
        for (int row = 5; row >= 0; row--) {
            sb.append("Row ").append(row).append(": ");
            for (int col = 0; col < 7; col++) {
                Object cell = board[row][col];
                if (cell == null) {
                    sb.append("[   ] ");
                } else {
                    try {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> cellMap = (Map<String, Object>) cell;
                        String player = (String) cellMap.get("player");
                        int value = ((Number) cellMap.get("value")).intValue();
                        String marker;
                        if ("player".equals(player)) {
                            marker = "P";
                        } else if (player.startsWith("ai")) {
                            marker = player.substring(2); // "ai1" -> "1"
                        } else {
                            marker = "?";
                        }
                        sb.append(String.format("[%s%2d] ", marker, value));
                    } catch (Exception e) {
                        sb.append("[???] ");
                    }
                }
            }
            sb.append("\n");
        }

        String aiNumber = aiPlayerId.replace("ai", "");
        sb.append("\nYou are AI").append(aiNumber).append(" (marked as ").append(aiNumber).append("). Your card: ").append(aiCard).append("\n\n");

        sb.append("Strategy:\n");
        sb.append("- Win if possible (complete YOUR 4 in a row)\n");
        sb.append("- Block others who are close to winning\n");
        sb.append("- In multiplayer, watch ALL opponents, not just the human\n");
        sb.append("- Avoid placing low cards where they can be easily covered\n\n");

        sb.append("Respond with ONLY the position in format: row,col\n");
        sb.append("Example: 3,4\n");
        sb.append("Choose a valid position (empty or value < ").append(aiCard).append(").");

        return sb.toString();
    }

    private String callGemini(String prompt) {
        Map<String, Object> requestBody = Map.of(
            "contents", List.of(
                Map.of("parts", List.of(
                    Map.of("text", prompt)
                ))
            ),
            "generationConfig", Map.of(
                "temperature", 0.7,
                "maxOutputTokens", 50
            )
        );

        String response = webClient.post()
                .uri(uriBuilder -> uriBuilder.queryParam("key", apiKey).build())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .block();

        // Parse Gemini response to extract text
        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && candidates.size() > 0) {
                JsonNode content = candidates.get(0).path("content");
                JsonNode parts = content.path("parts");
                if (parts.isArray() && parts.size() > 0) {
                    return parts.get(0).path("text").asText();
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse Gemini response: {}", response, e);
        }

        return response;
    }

    private int[] parseConnect4Response(String response) {
        // Look for pattern like "3,4" or "row: 3, col: 4" or "3, 4"
        Pattern pattern = Pattern.compile("(\\d+)\\s*,\\s*(\\d+)");
        Matcher matcher = pattern.matcher(response);

        if (matcher.find()) {
            int row = Integer.parseInt(matcher.group(1));
            int col = Integer.parseInt(matcher.group(2));

            // Validate bounds
            if (row >= 0 && row < 6 && col >= 0 && col < 7) {
                log.info("Gemini chose position: row={}, col={}", row, col);
                return new int[]{row, col};
            }
        }

        log.warn("Could not parse valid position from response: {}", response);
        return null;
    }
}

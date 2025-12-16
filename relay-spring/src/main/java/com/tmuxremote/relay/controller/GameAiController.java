package com.tmuxremote.relay.controller;

import com.tmuxremote.relay.service.GeminiService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/game")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class GameAiController {

    private final GeminiService geminiService;

    @PostMapping("/connect4/ai-move")
    public ResponseEntity<?> getConnect4AiMove(@RequestBody Connect4MoveRequest request) {
        log.info("AI move request - aiPlayer: {}, card: {}, totalPlayers: {}",
            request.getAiPlayerId(), request.getAiCard(), request.getTotalPlayers());

        if (!geminiService.isConfigured()) {
            log.warn("Gemini API not configured, returning fallback");
            return ResponseEntity.ok(Map.of(
                "success", false,
                "error", "AI service not configured",
                "fallback", true
            ));
        }

        try {
            int[] move = geminiService.getConnect4Move(
                request.getBoard(),
                request.getAiCard(),
                request.getAiPlayerId() != null ? request.getAiPlayerId() : "ai1",
                request.getTotalPlayers() > 0 ? request.getTotalPlayers() : 2
            );

            if (move != null) {
                log.info("{} chose move: row={}, col={}", request.getAiPlayerId(), move[0], move[1]);
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "row", move[0],
                    "col", move[1],
                    "aiPlayerId", request.getAiPlayerId()
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "error", "Failed to get AI move",
                    "fallback", true
                ));
            }
        } catch (Exception e) {
            log.error("Error getting AI move", e);
            return ResponseEntity.ok(Map.of(
                "success", false,
                "error", e.getMessage(),
                "fallback", true
            ));
        }
    }

    @GetMapping("/connect4/health")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "status", "ok",
            "geminiConfigured", geminiService.isConfigured()
        ));
    }

    @Data
    public static class Connect4MoveRequest {
        private Object[][] board;    // 6x7 board
        private int aiCard;          // Current AI card (1-10)
        private String aiPlayerId;   // "ai1", "ai2", "ai3"
        private int totalPlayers;    // 2, 3, or 4
    }
}

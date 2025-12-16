package com.sudoku.controller;

import com.sudoku.service.NurikabeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/nurikabe")
@RequiredArgsConstructor
public class NurikabeController {

    private final NurikabeService nurikabeService;

    /**
     * 게임 시작 - 오늘의 Nurikabe 퍼즐로 게임 시작
     */
    @PostMapping("/start")
    public ResponseEntity<Map<String, Object>> startGame(@RequestBody Map<String, Long> request) {
        Long playerId = request.get("playerId");
        if (playerId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "playerId is required"));
        }

        try {
            Map<String, Object> result = nurikabeService.startGame(playerId);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            if ("DAILY_LIMIT_REACHED".equals(e.getMessage())) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "DAILY_LIMIT_REACHED",
                        "message", "오늘의 게임을 이미 완료했습니다"
                ));
            }
            throw e;
        }
    }

    /**
     * 정답 확인
     */
    @PostMapping("/check")
    public ResponseEntity<Map<String, Object>> checkSolution(@RequestBody Map<String, Object> request) {
        Long sessionId = ((Number) request.get("sessionId")).longValue();
        String solution = (String) request.get("solution");

        try {
            Map<String, Object> result = nurikabeService.checkSolution(sessionId, solution);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 게임 완료
     */
    @PostMapping("/complete")
    public ResponseEntity<Map<String, Object>> completeGame(@RequestBody Map<String, Object> request) {
        Long sessionId = ((Number) request.get("sessionId")).longValue();
        String solution = (String) request.get("solution");
        int timeSeconds = ((Number) request.get("timeSeconds")).intValue();

        try {
            Map<String, Object> result = nurikabeService.completeGame(sessionId, solution, timeSeconds);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 힌트 사용
     */
    @PostMapping("/hint")
    public ResponseEntity<Map<String, Object>> useHint(@RequestBody Map<String, Object> request) {
        Long sessionId = ((Number) request.get("sessionId")).longValue();

        try {
            Map<String, Object> result = nurikabeService.useHint(sessionId);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 오늘의 플레이 상태 확인
     */
    @GetMapping("/daily-status/{playerId}")
    public ResponseEntity<Map<String, Object>> checkDailyStatus(@PathVariable Long playerId) {
        Map<String, Object> status = nurikabeService.checkDailyStatus(playerId);
        return ResponseEntity.ok(status);
    }

    /**
     * 오늘의 전체 랭킹 조회
     */
    @GetMapping("/today-ranking")
    public ResponseEntity<List<Map<String, Object>>> getTodayRanking(
            @RequestParam(defaultValue = "50") int limit) {
        List<Map<String, Object>> ranking = nurikabeService.getTodayRanking(limit);
        return ResponseEntity.ok(ranking);
    }
}

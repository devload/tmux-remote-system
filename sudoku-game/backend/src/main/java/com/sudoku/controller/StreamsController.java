package com.sudoku.controller;

import com.sudoku.service.StreamsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/streams")
@RequiredArgsConstructor
public class StreamsController {

    private final StreamsService streamsService;

    /**
     * 게임 시작 - 오늘의 Streams 퍼즐로 게임 시작
     */
    @PostMapping("/start")
    public ResponseEntity<Map<String, Object>> startGame(@RequestBody Map<String, Long> request) {
        Long playerId = request.get("playerId");
        if (playerId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "playerId is required"));
        }

        try {
            Map<String, Object> result = streamsService.startGame(playerId);
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
     * 다음 숫자 가져오기 - 현재 인덱스에 해당하는 숫자 반환
     */
    @GetMapping("/next-number/{sessionId}")
    public ResponseEntity<Map<String, Object>> getNextNumber(
            @PathVariable Long sessionId,
            @RequestParam int currentIndex) {
        try {
            Map<String, Object> result = streamsService.getNextNumber(sessionId, currentIndex);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 게임 완료 - 최종 배치 제출 및 점수 계산
     */
    @PostMapping("/complete")
    public ResponseEntity<Map<String, Object>> completeGame(@RequestBody Map<String, Object> request) {
        Long sessionId = ((Number) request.get("sessionId")).longValue();
        String placements = (String) request.get("placements");

        if (sessionId == null || placements == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "sessionId and placements are required"));
        }

        try {
            Map<String, Object> result = streamsService.completeGame(sessionId, placements);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 오늘의 플레이 상태 확인 (하루 1게임 제한)
     */
    @GetMapping("/daily-status/{playerId}")
    public ResponseEntity<Map<String, Object>> checkDailyStatus(@PathVariable Long playerId) {
        Map<String, Object> status = streamsService.checkDailyStatus(playerId);
        return ResponseEntity.ok(status);
    }

    /**
     * 오늘의 전체 랭킹 조회
     */
    @GetMapping("/today-ranking")
    public ResponseEntity<List<Map<String, Object>>> getTodayRanking(
            @RequestParam(defaultValue = "50") int limit) {
        List<Map<String, Object>> ranking = streamsService.getTodayRanking(limit);
        return ResponseEntity.ok(ranking);
    }

    /**
     * 고스트 데이터 조회 - 다른 플레이어들의 플레이 기록
     */
    @GetMapping("/ghost/{puzzleId}")
    public ResponseEntity<Map<String, Object>> getGhostData(@PathVariable Long puzzleId) {
        Map<String, Object> ghostData = streamsService.getGhostData(puzzleId);
        return ResponseEntity.ok(ghostData);
    }
}

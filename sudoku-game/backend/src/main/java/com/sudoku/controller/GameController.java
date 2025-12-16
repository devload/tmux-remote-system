package com.sudoku.controller;

import com.sudoku.dto.*;
import com.sudoku.service.GameService;
import com.sudoku.service.PuzzleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/game")
@RequiredArgsConstructor
public class GameController {

    private final GameService gameService;
    private final PuzzleService puzzleService;

    /**
     * 게임 시작 - 새 퍼즐 또는 특정 퍼즐로 게임 시작
     */
    @PostMapping("/start")
    public ResponseEntity<GameSessionDto> startGame(@Valid @RequestBody StartGameRequest request) {
        GameSessionDto session = gameService.startGame(request);
        return ResponseEntity.ok(session);
    }

    /**
     * 움직임 기록 - 플레이어가 숫자를 입력할 때마다 호출
     */
    @PostMapping("/move")
    public ResponseEntity<Void> recordMove(@Valid @RequestBody RecordMoveRequest request) {
        gameService.recordMove(request);
        return ResponseEntity.ok().build();
    }

    /**
     * 게임 완료 - 퍼즐을 다 풀었을 때 호출
     */
    @PostMapping("/complete")
    public ResponseEntity<GameSessionDto> completeGame(@Valid @RequestBody CompleteGameRequest request) {
        GameSessionDto result = gameService.completeGame(request);
        return ResponseEntity.ok(result);
    }

    /**
     * 고스트 데이터 조회 - 다른 플레이어들의 플레이 기록
     */
    @GetMapping("/ghost/{puzzleId}")
    public ResponseEntity<GhostDataDto> getGhostData(@PathVariable Long puzzleId) {
        GhostDataDto ghostData = gameService.getGhostData(puzzleId);
        return ResponseEntity.ok(ghostData);
    }

    /**
     * 리더보드 조회
     */
    @GetMapping("/leaderboard/{puzzleId}")
    public ResponseEntity<List<GameSessionDto>> getLeaderboard(
            @PathVariable Long puzzleId,
            @RequestParam(defaultValue = "10") int limit) {
        List<GameSessionDto> leaderboard = gameService.getLeaderboard(puzzleId, limit);
        return ResponseEntity.ok(leaderboard);
    }

    /**
     * 특정 퍼즐 조회
     */
    @GetMapping("/puzzle/{puzzleId}")
    public ResponseEntity<PuzzleDto> getPuzzle(@PathVariable Long puzzleId) {
        PuzzleDto puzzle = puzzleService.getPuzzleById(puzzleId);
        return ResponseEntity.ok(puzzle);
    }

    /**
     * 플레이어의 오늘 게임 상태 확인 (하루 1게임 제한)
     */
    @GetMapping("/daily-status/{playerId}")
    public ResponseEntity<Map<String, Object>> checkDailyStatus(@PathVariable Long playerId) {
        Map<String, Object> status = gameService.checkDailyStatus(playerId);
        return ResponseEntity.ok(status);
    }

    /**
     * 오늘의 전체 랭킹 조회
     */
    @GetMapping("/today-ranking")
    public ResponseEntity<List<Map<String, Object>>> getTodayRanking(
            @RequestParam(defaultValue = "50") int limit) {
        List<Map<String, Object>> ranking = gameService.getTodayRanking(limit);
        return ResponseEntity.ok(ranking);
    }
}

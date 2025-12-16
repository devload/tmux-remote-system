package com.sudoku.service;

import com.sudoku.dto.*;
import com.sudoku.entity.*;
import com.sudoku.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GameService {

    private final GameSessionRepository gameSessionRepository;
    private final MoveRecordRepository moveRecordRepository;
    private final PlayerService playerService;
    private final PuzzleService puzzleService;

    private static final int MAX_GHOST_PLAYERS = 5;  // 고스트로 보여줄 최대 플레이어 수

    @Transactional
    public GameSessionDto startGame(StartGameRequest request) {
        Player player = playerService.getPlayerEntityById(request.getPlayerId());

        // 하루 1게임 제한 체크
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        List<GameSession> todayGames = gameSessionRepository.findTodayCompletedByPlayer(player, startOfDay);
        if (!todayGames.isEmpty()) {
            throw new RuntimeException("DAILY_LIMIT_REACHED");
        }

        Puzzle puzzle;
        if (request.getPuzzleId() != null) {
            puzzle = puzzleService.getPuzzleEntityById(request.getPuzzleId());
        } else {
            // 오늘의 퍼즐 가져오기 (난이도 무시, 모든 플레이어가 같은 퍼즐)
            puzzle = puzzleService.getTodayPuzzle();
        }

        // 기존 미완료 세션이 있으면 삭제
        gameSessionRepository.findByPlayerAndPuzzle(player, puzzle)
                .ifPresent(existing -> {
                    if (!existing.getIsCompleted()) {
                        moveRecordRepository.deleteByGameSession(existing);
                        gameSessionRepository.delete(existing);
                    }
                });

        GameSession session = GameSession.builder()
                .player(player)
                .puzzle(puzzle)
                .isCompleted(false)
                .mistakes(0)
                .hintsUsed(0)
                .build();

        session = gameSessionRepository.save(session);
        log.info("게임 시작: 플레이어={}, 퍼즐={}", player.getNickname(), puzzle.getId());

        return toDto(session, true);
    }

    /**
     * 플레이어의 오늘 게임 상태 확인
     */
    @Transactional(readOnly = true)
    public Map<String, Object> checkDailyStatus(Long playerId) {
        Player player = playerService.getPlayerEntityById(playerId);
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        List<GameSession> todayGames = gameSessionRepository.findTodayCompletedByPlayer(player, startOfDay);

        Map<String, Object> result = new HashMap<>();
        result.put("canPlay", todayGames.isEmpty());
        result.put("playedToday", !todayGames.isEmpty());

        if (!todayGames.isEmpty()) {
            GameSession todayGame = todayGames.get(0);
            result.put("todayGameId", todayGame.getId());
            result.put("todayTime", todayGame.getCompletionTimeSeconds());
            result.put("todayRank", todayGame.getRank());
        }

        return result;
    }

    /**
     * 오늘의 전체 랭킹 조회
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTodayRanking(int limit) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        List<GameSession> rankings = gameSessionRepository.findTodayRanking(startOfDay);

        List<Map<String, Object>> result = new ArrayList<>();
        int rank = 1;
        for (GameSession session : rankings) {
            if (rank > limit) break;

            Map<String, Object> entry = new HashMap<>();
            entry.put("rank", rank);
            entry.put("playerId", session.getPlayer().getId());
            entry.put("nickname", session.getPlayer().getNickname());
            entry.put("avatarId", session.getPlayer().getAvatarId());
            entry.put("avatarColor", session.getPlayer().getAvatarColor());
            entry.put("completionTimeSeconds", session.getCompletionTimeSeconds());
            entry.put("mistakes", session.getMistakes());
            result.add(entry);
            rank++;
        }

        return result;
    }

    @Transactional
    public void recordMove(RecordMoveRequest request) {
        GameSession session = gameSessionRepository.findById(request.getGameSessionId())
                .orElseThrow(() -> new RuntimeException("게임 세션을 찾을 수 없습니다"));

        if (session.getIsCompleted()) {
            throw new RuntimeException("이미 완료된 게임입니다");
        }

        int moveOrder = session.getMoveRecords().size() + 1;

        MoveRecord move = MoveRecord.builder()
                .gameSession(session)
                .moveOrder(moveOrder)
                .rowIndex(request.getRowIndex())
                .colIndex(request.getColIndex())
                .inputNumber(request.getInputNumber())
                .isCorrect(request.getIsCorrect())
                .timestampMs(request.getTimestampMs())
                .build();

        moveRecordRepository.save(move);
    }

    @Transactional
    public GameSessionDto completeGame(CompleteGameRequest request) {
        GameSession session = gameSessionRepository.findById(request.getGameSessionId())
                .orElseThrow(() -> new RuntimeException("게임 세션을 찾을 수 없습니다"));

        if (session.getIsCompleted()) {
            throw new RuntimeException("이미 완료된 게임입니다");
        }

        session.setIsCompleted(true);
        session.setCompletedAt(LocalDateTime.now());
        session.setCompletionTimeSeconds(request.getCompletionTimeSeconds());
        session.setMistakes(request.getMistakes());
        session.setHintsUsed(request.getHintsUsed());

        // 순위 계산
        List<GameSession> completedSessions = gameSessionRepository
                .findCompletedByPuzzleOrderByTime(session.getPuzzle());
        int rank = 1;
        for (GameSession s : completedSessions) {
            if (s.getCompletionTimeSeconds() < request.getCompletionTimeSeconds()) {
                rank++;
            }
        }
        session.setRank(rank);

        gameSessionRepository.save(session);

        // 퍼즐 통계 업데이트
        Puzzle puzzle = session.getPuzzle();
        puzzle.setCompletionCount(puzzle.getCompletionCount() + 1);
        if (puzzle.getBestTimeSeconds() == null ||
            request.getCompletionTimeSeconds() < puzzle.getBestTimeSeconds()) {
            puzzle.setBestTimeSeconds(request.getCompletionTimeSeconds());
        }

        // 플레이어 통계 업데이트
        playerService.updatePlayerStats(
                session.getPlayer().getId(),
                true,
                request.getCompletionTimeSeconds()
        );

        log.info("게임 완료: 플레이어={}, 시간={}초, 순위={}",
                session.getPlayer().getNickname(),
                request.getCompletionTimeSeconds(),
                rank);

        return toDto(session, false);
    }

    @Transactional(readOnly = true)
    public GhostDataDto getGhostData(Long puzzleId) {
        List<GameSession> completedSessions = gameSessionRepository.findTopCompletedWithMoves(puzzleId);

        if (completedSessions.isEmpty()) {
            return GhostDataDto.builder()
                    .puzzleId(puzzleId)
                    .totalPlayers(0)
                    .ghostPlayers(Collections.emptyList())
                    .build();
        }

        List<GhostDataDto.GhostPlayerDto> ghostPlayers = completedSessions.stream()
                .limit(MAX_GHOST_PLAYERS)
                .map(session -> {
                    Player player = session.getPlayer();

                    // 정답인 움직임만 필터링
                    List<GhostDataDto.GhostMoveDto> moves = session.getMoveRecords().stream()
                            .filter(MoveRecord::getIsCorrect)
                            .map(move -> GhostDataDto.GhostMoveDto.builder()
                                    .rowIndex(move.getRowIndex())
                                    .colIndex(move.getColIndex())
                                    .timestampMs(move.getTimestampMs())
                                    .build())
                            .collect(Collectors.toList());

                    return GhostDataDto.GhostPlayerDto.builder()
                            .playerId(player.getId())
                            .nickname(player.getNickname())
                            .avatarId(player.getAvatarId())
                            .avatarColor(player.getAvatarColor())
                            .rank(session.getRank())
                            .completionTimeSeconds(session.getCompletionTimeSeconds())
                            .moves(moves)
                            .build();
                })
                .collect(Collectors.toList());

        return GhostDataDto.builder()
                .puzzleId(puzzleId)
                .totalPlayers(completedSessions.size())
                .ghostPlayers(ghostPlayers)
                .build();
    }

    @Transactional(readOnly = true)
    public List<GameSessionDto> getLeaderboard(Long puzzleId, int limit) {
        List<GameSession> sessions = gameSessionRepository.findTopCompletedWithMoves(puzzleId);
        return sessions.stream()
                .limit(limit)
                .map(s -> toDto(s, false))
                .collect(Collectors.toList());
    }

    private GameSessionDto toDto(GameSession session, boolean includePuzzle) {
        GameSessionDto.GameSessionDtoBuilder builder = GameSessionDto.builder()
                .id(session.getId())
                .playerId(session.getPlayer().getId())
                .puzzleId(session.getPuzzle().getId())
                .isCompleted(session.getIsCompleted())
                .completionTimeSeconds(session.getCompletionTimeSeconds())
                .mistakes(session.getMistakes())
                .hintsUsed(session.getHintsUsed())
                .rank(session.getRank());

        if (includePuzzle) {
            builder.puzzle(puzzleService.getPuzzleById(session.getPuzzle().getId()));
        }

        return builder.build();
    }
}

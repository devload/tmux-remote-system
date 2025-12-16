package com.sudoku.repository;

import com.sudoku.entity.GameSession;
import com.sudoku.entity.Player;
import com.sudoku.entity.Puzzle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface GameSessionRepository extends JpaRepository<GameSession, Long> {

    // 특정 퍼즐의 완료된 게임 세션들 (빠른 순서대로)
    @Query("SELECT gs FROM GameSession gs " +
           "WHERE gs.puzzle = :puzzle AND gs.isCompleted = true " +
           "ORDER BY gs.completionTimeSeconds ASC")
    List<GameSession> findCompletedByPuzzleOrderByTime(@Param("puzzle") Puzzle puzzle);

    // 특정 퍼즐의 완료된 게임 세션 수
    @Query("SELECT COUNT(gs) FROM GameSession gs WHERE gs.puzzle = :puzzle AND gs.isCompleted = true")
    Long countCompletedByPuzzle(@Param("puzzle") Puzzle puzzle);

    // 플레이어의 특정 퍼즐 게임 기록
    Optional<GameSession> findByPlayerAndPuzzle(Player player, Puzzle puzzle);

    // 플레이어의 모든 게임 세션
    List<GameSession> findByPlayerOrderByStartedAtDesc(Player player);

    // 플레이어의 완료된 게임 수
    @Query("SELECT COUNT(gs) FROM GameSession gs WHERE gs.player = :player AND gs.isCompleted = true")
    Long countCompletedByPlayer(@Param("player") Player player);

    // 특정 퍼즐의 상위 N명 기록 (고스트 데이터용)
    @Query("SELECT gs FROM GameSession gs " +
           "JOIN FETCH gs.player " +
           "JOIN FETCH gs.moveRecords " +
           "WHERE gs.puzzle.id = :puzzleId AND gs.isCompleted = true " +
           "ORDER BY gs.completionTimeSeconds ASC")
    List<GameSession> findTopCompletedWithMoves(@Param("puzzleId") Long puzzleId);

    // 플레이어의 오늘 완료된 게임 확인 (하루 1게임 제한용)
    @Query("SELECT gs FROM GameSession gs " +
           "WHERE gs.player = :player AND gs.isCompleted = true " +
           "AND gs.completedAt >= :startOfDay " +
           "ORDER BY gs.completedAt DESC")
    List<GameSession> findTodayCompletedByPlayer(@Param("player") Player player, @Param("startOfDay") LocalDateTime startOfDay);

    // 오늘의 전체 랭킹 (완료된 모든 플레이어)
    @Query("SELECT gs FROM GameSession gs " +
           "JOIN FETCH gs.player " +
           "WHERE gs.isCompleted = true AND gs.completedAt >= :startOfDay " +
           "ORDER BY gs.completionTimeSeconds ASC")
    List<GameSession> findTodayRanking(@Param("startOfDay") LocalDateTime startOfDay);
}

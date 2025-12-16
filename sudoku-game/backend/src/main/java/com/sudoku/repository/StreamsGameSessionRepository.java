package com.sudoku.repository;

import com.sudoku.entity.Player;
import com.sudoku.entity.StreamsGameSession;
import com.sudoku.entity.StreamsPuzzle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface StreamsGameSessionRepository extends JpaRepository<StreamsGameSession, Long> {

    Optional<StreamsGameSession> findByPlayerAndStreamsPuzzle(Player player, StreamsPuzzle puzzle);

    // 플레이어의 오늘 완료된 게임 확인 (하루 1게임 제한용)
    @Query("SELECT gs FROM StreamsGameSession gs " +
           "WHERE gs.player = :player AND gs.isCompleted = true " +
           "AND gs.completedAt >= :startOfDay " +
           "ORDER BY gs.completedAt DESC")
    List<StreamsGameSession> findTodayCompletedByPlayer(
            @Param("player") Player player,
            @Param("startOfDay") LocalDateTime startOfDay);

    // 오늘의 전체 랭킹 (점수 높은 순)
    @Query("SELECT gs FROM StreamsGameSession gs " +
           "JOIN FETCH gs.player " +
           "WHERE gs.isCompleted = true AND gs.completedAt >= :startOfDay " +
           "ORDER BY gs.finalScore DESC")
    List<StreamsGameSession> findTodayRanking(@Param("startOfDay") LocalDateTime startOfDay);

    // 특정 퍼즐의 완료된 게임들 (고스트 데이터용)
    @Query("SELECT gs FROM StreamsGameSession gs " +
           "JOIN FETCH gs.player " +
           "WHERE gs.streamsPuzzle.id = :puzzleId AND gs.isCompleted = true " +
           "ORDER BY gs.finalScore DESC")
    List<StreamsGameSession> findCompletedByPuzzle(@Param("puzzleId") Long puzzleId);
}

package com.sudoku.repository;

import com.sudoku.entity.HitoriGameSession;
import com.sudoku.entity.HitoriPuzzle;
import com.sudoku.entity.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface HitoriGameSessionRepository extends JpaRepository<HitoriGameSession, Long> {

    Optional<HitoriGameSession> findByPlayerAndHitoriPuzzle(Player player, HitoriPuzzle puzzle);

    @Query("SELECT s FROM HitoriGameSession s WHERE s.player = :player AND s.isCompleted = true AND s.startedAt >= :startOfDay")
    List<HitoriGameSession> findTodayCompletedByPlayer(@Param("player") Player player, @Param("startOfDay") LocalDateTime startOfDay);

    @Query("SELECT s FROM HitoriGameSession s WHERE s.isCompleted = true AND s.startedAt >= :startOfDay ORDER BY s.finalScore DESC, s.timeSeconds ASC")
    List<HitoriGameSession> findTodayRanking(@Param("startOfDay") LocalDateTime startOfDay);

    @Query("SELECT s FROM HitoriGameSession s WHERE s.hitoriPuzzle.id = :puzzleId AND s.isCompleted = true ORDER BY s.finalScore DESC, s.timeSeconds ASC")
    List<HitoriGameSession> findCompletedByPuzzle(@Param("puzzleId") Long puzzleId);
}

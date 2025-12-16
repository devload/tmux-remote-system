package com.sudoku.repository;

import com.sudoku.entity.NurikabeGameSession;
import com.sudoku.entity.NurikabePuzzle;
import com.sudoku.entity.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface NurikabeGameSessionRepository extends JpaRepository<NurikabeGameSession, Long> {

    Optional<NurikabeGameSession> findByPlayerAndNurikabePuzzle(Player player, NurikabePuzzle puzzle);

    @Query("SELECT s FROM NurikabeGameSession s WHERE s.player = :player AND s.isCompleted = true AND s.createdAt >= :startOfDay")
    List<NurikabeGameSession> findTodayCompletedByPlayer(@Param("player") Player player, @Param("startOfDay") LocalDateTime startOfDay);

    @Query("SELECT s FROM NurikabeGameSession s WHERE s.isCompleted = true AND s.createdAt >= :startOfDay ORDER BY s.finalScore DESC, s.timeSeconds ASC")
    List<NurikabeGameSession> findTodayRanking(@Param("startOfDay") LocalDateTime startOfDay);
}

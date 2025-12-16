package com.sudoku.repository;

import com.sudoku.entity.Puzzle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PuzzleRepository extends JpaRepository<Puzzle, Long> {

    Optional<Puzzle> findByPuzzleHash(String puzzleHash);

    boolean existsByPuzzleHash(String puzzleHash);

    List<Puzzle> findByDifficultyOrderByPlayCountDesc(Puzzle.Difficulty difficulty);

    @Query("SELECT p FROM Puzzle p WHERE p.difficulty = :difficulty ORDER BY RANDOM()")
    List<Puzzle> findRandomByDifficulty(Puzzle.Difficulty difficulty);

    @Query("SELECT p FROM Puzzle p ORDER BY p.playCount DESC")
    List<Puzzle> findPopularPuzzles();
}

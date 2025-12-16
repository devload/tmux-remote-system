package com.sudoku.repository;

import com.sudoku.entity.HitoriPuzzle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HitoriPuzzleRepository extends JpaRepository<HitoriPuzzle, Long> {
    Optional<HitoriPuzzle> findByPuzzleHash(String puzzleHash);
}

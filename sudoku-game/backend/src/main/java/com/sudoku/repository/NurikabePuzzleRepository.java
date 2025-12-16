package com.sudoku.repository;

import com.sudoku.entity.NurikabePuzzle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NurikabePuzzleRepository extends JpaRepository<NurikabePuzzle, Long> {
    Optional<NurikabePuzzle> findByPuzzleHash(String puzzleHash);
}

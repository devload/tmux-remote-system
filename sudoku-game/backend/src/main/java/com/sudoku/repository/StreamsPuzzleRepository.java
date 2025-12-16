package com.sudoku.repository;

import com.sudoku.entity.StreamsPuzzle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StreamsPuzzleRepository extends JpaRepository<StreamsPuzzle, Long> {

    Optional<StreamsPuzzle> findByPuzzleHash(String puzzleHash);

    boolean existsByPuzzleHash(String puzzleHash);
}

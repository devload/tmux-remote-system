package com.sudoku.repository;

import com.sudoku.entity.GameSession;
import com.sudoku.entity.MoveRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MoveRecordRepository extends JpaRepository<MoveRecord, Long> {

    List<MoveRecord> findByGameSessionOrderByMoveOrderAsc(GameSession gameSession);

    void deleteByGameSession(GameSession gameSession);
}

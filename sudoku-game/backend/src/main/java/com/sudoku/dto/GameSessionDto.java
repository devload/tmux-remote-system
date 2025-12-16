package com.sudoku.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameSessionDto {
    private Long id;
    private Long playerId;
    private Long puzzleId;
    private PuzzleDto puzzle;
    private Boolean isCompleted;
    private Long completionTimeSeconds;
    private Integer mistakes;
    private Integer hintsUsed;
    private Integer rank;
    private List<MoveRecordDto> moveRecords;
}

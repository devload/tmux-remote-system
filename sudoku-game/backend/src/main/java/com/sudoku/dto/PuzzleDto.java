package com.sudoku.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PuzzleDto {
    private Long id;
    private String puzzleHash;
    private String difficulty;
    private int[][] initialBoard;
    private Integer playCount;
    private Integer completionCount;
    private Long bestTimeSeconds;
}

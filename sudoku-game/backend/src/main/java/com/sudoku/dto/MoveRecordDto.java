package com.sudoku.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MoveRecordDto {
    private Integer moveOrder;
    private Integer rowIndex;
    private Integer colIndex;
    private Integer inputNumber;
    private Boolean isCorrect;
    private Long timestampMs;
}

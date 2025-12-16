package com.sudoku.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecordMoveRequest {

    @NotNull
    private Long gameSessionId;

    @NotNull
    @Min(0) @Max(5)
    private Integer rowIndex;

    @NotNull
    @Min(0) @Max(5)
    private Integer colIndex;

    @NotNull
    @Min(0) @Max(6)
    private Integer inputNumber;

    @NotNull
    private Boolean isCorrect;

    @NotNull
    private Long timestampMs;  // 게임 시작부터의 시간
}

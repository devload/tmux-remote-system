package com.sudoku.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompleteGameRequest {

    @NotNull
    private Long gameSessionId;

    @NotNull
    private Long completionTimeSeconds;

    @NotNull
    private Integer mistakes;

    @NotNull
    private Integer hintsUsed;
}

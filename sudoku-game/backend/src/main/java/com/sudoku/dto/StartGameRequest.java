package com.sudoku.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StartGameRequest {

    @NotNull(message = "플레이어 ID는 필수입니다")
    private Long playerId;

    private Long puzzleId;  // null이면 랜덤 퍼즐 선택

    private String difficulty;  // EASY, MEDIUM, HARD
}

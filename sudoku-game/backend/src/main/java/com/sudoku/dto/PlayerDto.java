package com.sudoku.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerDto {
    private Long id;
    private String nickname;
    private String avatarId;
    private String avatarColor;
    private Integer totalGames;
    private Integer wins;
    private Long bestTimeSeconds;
}

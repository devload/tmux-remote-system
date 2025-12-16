package com.sudoku.dto;

import lombok.*;
import java.util.List;

/**
 * 다른 플레이어들의 플레이 기록 (고스트 데이터)
 * 같은 퍼즐을 먼저 푼 사람들의 움직임을 보여줌
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GhostDataDto {

    private Long puzzleId;
    private Integer totalPlayers;  // 해당 퍼즐을 완료한 총 플레이어 수
    private List<GhostPlayerDto> ghostPlayers;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GhostPlayerDto {
        private Long playerId;
        private String nickname;
        private String avatarId;
        private String avatarColor;
        private Integer rank;
        private Long completionTimeSeconds;
        private List<GhostMoveDto> moves;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GhostMoveDto {
        private Integer rowIndex;
        private Integer colIndex;
        private Long timestampMs;  // 정답만 포함 (오답은 제외)
    }
}

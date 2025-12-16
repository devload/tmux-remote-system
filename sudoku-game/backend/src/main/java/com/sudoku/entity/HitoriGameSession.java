package com.sudoku.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "hitori_game_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HitoriGameSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hitori_puzzle_id", nullable = false)
    private HitoriPuzzle hitoriPuzzle;

    @Column(nullable = false)
    private LocalDateTime startedAt;

    @Column
    private LocalDateTime completedAt;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isCompleted = false;

    @Column(length = 500)
    private String playerSolution;  // JSON: 플레이어가 칠한 셀들

    @Column
    private Integer timeSeconds;  // 완료 시간 (초)

    @Column
    private Integer hintsUsed;  // 사용한 힌트 수

    @Column
    private Integer mistakes;  // 실수 횟수

    @Column
    private Integer finalScore;  // 최종 점수

    @Column
    private Integer rank;  // 오늘의 순위

    @PrePersist
    protected void onCreate() {
        startedAt = LocalDateTime.now();
    }
}

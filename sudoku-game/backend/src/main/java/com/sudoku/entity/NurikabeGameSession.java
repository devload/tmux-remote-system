package com.sudoku.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "nurikabe_game_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NurikabeGameSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nurikabe_puzzle_id", nullable = false)
    private NurikabePuzzle nurikabePuzzle;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isCompleted = false;

    private LocalDateTime completedAt;

    @Column(columnDefinition = "TEXT")
    private String playerSolution;

    private Integer timeSeconds;

    @Column(nullable = false)
    @Builder.Default
    private Integer hintsUsed = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer mistakes = 0;

    private Integer finalScore;

    private Integer rank;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}

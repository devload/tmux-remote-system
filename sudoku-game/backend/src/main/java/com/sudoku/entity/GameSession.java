package com.sudoku.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "game_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "puzzle_id", nullable = false)
    private Puzzle puzzle;

    @Column(nullable = false)
    private LocalDateTime startedAt;

    @Column
    private LocalDateTime completedAt;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isCompleted = false;

    @Column
    private Long completionTimeSeconds;  // 완료까지 걸린 시간 (초)

    @Column(nullable = false)
    @Builder.Default
    private Integer mistakes = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer hintsUsed = 0;

    // 순위 (해당 퍼즐에서의 순위, 완료 후 계산)
    @Column
    private Integer rank;

    @OneToMany(mappedBy = "gameSession", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("moveOrder ASC")
    @Builder.Default
    private List<MoveRecord> moveRecords = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        startedAt = LocalDateTime.now();
    }
}

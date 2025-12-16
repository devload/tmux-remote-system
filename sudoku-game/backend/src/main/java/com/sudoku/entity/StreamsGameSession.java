package com.sudoku.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "streams_game_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StreamsGameSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "streams_puzzle_id", nullable = false)
    private StreamsPuzzle streamsPuzzle;

    @Column(nullable = false)
    private LocalDateTime startedAt;

    @Column
    private LocalDateTime completedAt;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isCompleted = false;

    @Column(length = 500)
    private String placements;  // JSON: 플레이어가 배치한 위치들 [{number:3, row:0, col:2, timestampMs:1500}, ...]

    @Column
    private Integer finalScore;

    @Column
    private Integer longestStream;  // 가장 긴 스트림 길이

    @Column
    private Integer rank;  // 순위

    @PrePersist
    protected void onCreate() {
        startedAt = LocalDateTime.now();
    }
}

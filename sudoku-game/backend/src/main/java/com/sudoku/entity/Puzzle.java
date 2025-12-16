package com.sudoku.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "puzzles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Puzzle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String puzzleHash;  // 퍼즐 고유 해시 (초기 상태 기반)

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Difficulty difficulty;

    @Column(nullable = false, length = 100)
    private String initialBoard;  // JSON: 초기 보드 상태 (빈칸 포함)

    @Column(nullable = false, length = 100)
    private String solution;  // JSON: 정답

    @Column(nullable = false)
    private LocalDateTime createdAt;

    // 통계
    @Column(nullable = false)
    @Builder.Default
    private Integer playCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer completionCount = 0;

    @Column
    private Long avgCompletionTimeSeconds;  // 평균 완료 시간

    @Column
    private Long bestTimeSeconds;  // 최고 기록

    @OneToMany(mappedBy = "puzzle", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<GameSession> gameSessions = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum Difficulty {
        EASY, MEDIUM, HARD
    }
}

package com.sudoku.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "hitori_puzzles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HitoriPuzzle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String puzzleHash;  // 날짜 기반 해시

    @Column(nullable = false, length = 500)
    private String initialBoard;  // JSON: 초기 퍼즐 보드

    @Column(nullable = false, length = 500)
    private String solution;  // JSON: 정답 (검게 칠할 셀들의 위치)

    @Column(nullable = false)
    private Integer gridSize;  // 보드 크기 (5, 6, 7, 8...)

    @Column(nullable = false)
    private String difficulty;  // easy, medium, hard

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
    private Integer bestTime;  // 최고 기록 (초)

    @Column
    private Double avgTime;  // 평균 시간

    @OneToMany(mappedBy = "hitoriPuzzle", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<HitoriGameSession> gameSessions = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

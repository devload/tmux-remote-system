package com.sudoku.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "streams_puzzles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StreamsPuzzle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String puzzleHash;  // 날짜 기반 해시

    @Column(nullable = false, length = 200)
    private String numberSequence;  // JSON: 1-20 숫자가 나올 순서 [3,17,8,1,...]

    @Column(nullable = false)
    private Integer gridSize;  // 보드 크기 (기본 20칸 = 4x5 또는 5x4)

    @Column(nullable = false)
    private Integer gridRows;  // 행 수

    @Column(nullable = false)
    private Integer gridCols;  // 열 수

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
    private Integer bestScore;

    @Column
    private Double avgScore;

    @OneToMany(mappedBy = "streamsPuzzle", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<StreamsGameSession> gameSessions = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

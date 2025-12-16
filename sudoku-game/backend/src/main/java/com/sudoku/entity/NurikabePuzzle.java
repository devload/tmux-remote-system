package com.sudoku.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "nurikabe_puzzles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NurikabePuzzle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String puzzleHash;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String initialBoard; // JSON: 2D array with numbers (islands) and 0 (empty)

    @Column(columnDefinition = "TEXT", nullable = false)
    private String solution; // JSON: Set of "row,col" for sea cells

    @Column(nullable = false)
    private Integer gridSize;

    @Column(nullable = false)
    private String difficulty;

    @Column(nullable = false)
    @Builder.Default
    private Integer playCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer completionCount = 0;

    private Integer bestTime;

    private Integer avgTime;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}

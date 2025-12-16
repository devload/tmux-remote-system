package com.sudoku.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "move_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MoveRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_session_id", nullable = false)
    private GameSession gameSession;

    @Column(nullable = false)
    private Integer moveOrder;  // 움직임 순서 (1, 2, 3, ...)

    @Column(nullable = false)
    private Integer rowIndex;  // 행 (0-5)

    @Column(nullable = false)
    private Integer colIndex;  // 열 (0-5)

    @Column(nullable = false)
    private Integer inputNumber;  // 입력한 숫자 (1-6, 0은 지우기)

    @Column(nullable = false)
    private Boolean isCorrect;  // 정답 여부

    @Column(nullable = false)
    private Long timestampMs;  // 게임 시작부터의 시간 (밀리초)
}

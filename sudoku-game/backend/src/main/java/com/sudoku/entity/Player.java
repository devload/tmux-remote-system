package com.sudoku.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "players")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String nickname;

    @Column(nullable = false, length = 20)
    private String avatarId;  // 선택한 아바타 ID (avatar_1, avatar_2, ...)

    @Column(length = 7)
    private String avatarColor;  // 아바타 배경색 (#FF5733)

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime lastPlayedAt;

    // 통계
    @Column(nullable = false)
    @Builder.Default
    private Integer totalGames = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer wins = 0;

    @Column(nullable = false)
    @Builder.Default
    private Long bestTimeSeconds = 0L;  // 최고 기록 (초)

    @OneToMany(mappedBy = "player", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<GameSession> gameSessions = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

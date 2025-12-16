package com.sudoku.controller;

import com.sudoku.dto.CreatePlayerRequest;
import com.sudoku.dto.PlayerDto;
import com.sudoku.service.PlayerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/players")
@RequiredArgsConstructor
public class PlayerController {

    private final PlayerService playerService;

    @PostMapping
    public ResponseEntity<PlayerDto> createPlayer(@Valid @RequestBody CreatePlayerRequest request) {
        PlayerDto player = playerService.createPlayer(request);
        return ResponseEntity.ok(player);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlayerDto> getPlayer(@PathVariable Long id) {
        PlayerDto player = playerService.getPlayerById(id);
        return ResponseEntity.ok(player);
    }

    @GetMapping("/check-nickname")
    public ResponseEntity<Map<String, Boolean>> checkNickname(@RequestParam String nickname) {
        boolean exists = playerService.existsByNickname(nickname);
        return ResponseEntity.ok(Map.of("exists", exists, "available", !exists));
    }

    @GetMapping("/avatars")
    public ResponseEntity<Map<String, Object>> getAvailableAvatars() {
        // 사용 가능한 아바타 목록
        var avatars = java.util.List.of(
            Map.of("id", "avatar_cat", "name", "Cat", "emoji", "🐱"),
            Map.of("id", "avatar_dog", "name", "Dog", "emoji", "🐶"),
            Map.of("id", "avatar_fox", "name", "Fox", "emoji", "🦊"),
            Map.of("id", "avatar_bear", "name", "Bear", "emoji", "🐻"),
            Map.of("id", "avatar_panda", "name", "Panda", "emoji", "🐼"),
            Map.of("id", "avatar_rabbit", "name", "Rabbit", "emoji", "🐰"),
            Map.of("id", "avatar_koala", "name", "Koala", "emoji", "🐨"),
            Map.of("id", "avatar_lion", "name", "Lion", "emoji", "🦁"),
            Map.of("id", "avatar_tiger", "name", "Tiger", "emoji", "🐯"),
            Map.of("id", "avatar_monkey", "name", "Monkey", "emoji", "🐵"),
            Map.of("id", "avatar_penguin", "name", "Penguin", "emoji", "🐧"),
            Map.of("id", "avatar_owl", "name", "Owl", "emoji", "🦉")
        );

        var colors = java.util.List.of(
            "#5e81f4", "#7c3aed", "#ec4899", "#f43f5e",
            "#f97316", "#eab308", "#22c55e", "#14b8a6",
            "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef"
        );

        return ResponseEntity.ok(Map.of("avatars", avatars, "colors", colors));
    }
}

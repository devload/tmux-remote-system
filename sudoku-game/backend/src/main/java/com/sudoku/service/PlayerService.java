package com.sudoku.service;

import com.sudoku.dto.CreatePlayerRequest;
import com.sudoku.dto.PlayerDto;
import com.sudoku.entity.Player;
import com.sudoku.repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlayerService {

    private final PlayerRepository playerRepository;

    @Transactional
    public PlayerDto createPlayer(CreatePlayerRequest request) {
        if (playerRepository.existsByNickname(request.getNickname())) {
            throw new RuntimeException("이미 사용 중인 닉네임입니다: " + request.getNickname());
        }

        Player player = Player.builder()
                .nickname(request.getNickname())
                .avatarId(request.getAvatarId())
                .avatarColor(request.getAvatarColor() != null ? request.getAvatarColor() : "#5e81f4")
                .build();

        player = playerRepository.save(player);
        log.info("새 플레이어 생성: {} ({})", player.getNickname(), player.getAvatarId());

        return toDto(player);
    }

    @Transactional(readOnly = true)
    public PlayerDto getPlayerById(Long id) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("플레이어를 찾을 수 없습니다: " + id));
        return toDto(player);
    }

    @Transactional(readOnly = true)
    public PlayerDto getPlayerByNickname(String nickname) {
        Player player = playerRepository.findByNickname(nickname)
                .orElseThrow(() -> new RuntimeException("플레이어를 찾을 수 없습니다: " + nickname));
        return toDto(player);
    }

    @Transactional(readOnly = true)
    public Player getPlayerEntityById(Long id) {
        return playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("플레이어를 찾을 수 없습니다: " + id));
    }

    @Transactional
    public void updatePlayerStats(Long playerId, boolean isWin, Long completionTime) {
        Player player = getPlayerEntityById(playerId);
        player.setTotalGames(player.getTotalGames() + 1);
        player.setLastPlayedAt(LocalDateTime.now());

        if (isWin) {
            player.setWins(player.getWins() + 1);
            if (player.getBestTimeSeconds() == 0 || completionTime < player.getBestTimeSeconds()) {
                player.setBestTimeSeconds(completionTime);
            }
        }

        playerRepository.save(player);
    }

    @Transactional(readOnly = true)
    public boolean existsByNickname(String nickname) {
        return playerRepository.existsByNickname(nickname);
    }

    private PlayerDto toDto(Player player) {
        return PlayerDto.builder()
                .id(player.getId())
                .nickname(player.getNickname())
                .avatarId(player.getAvatarId())
                .avatarColor(player.getAvatarColor())
                .totalGames(player.getTotalGames())
                .wins(player.getWins())
                .bestTimeSeconds(player.getBestTimeSeconds())
                .build();
    }
}

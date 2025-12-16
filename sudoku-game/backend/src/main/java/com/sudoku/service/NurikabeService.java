package com.sudoku.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sudoku.entity.NurikabeGameSession;
import com.sudoku.entity.NurikabePuzzle;
import com.sudoku.entity.Player;
import com.sudoku.repository.NurikabeGameSessionRepository;
import com.sudoku.repository.NurikabePuzzleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class NurikabeService {

    private final NurikabePuzzleRepository puzzleRepository;
    private final NurikabeGameSessionRepository sessionRepository;
    private final PlayerService playerService;
    private final ObjectMapper objectMapper;

    private static final int DEFAULT_GRID_SIZE = 7;

    /**
     * 오늘의 Nurikabe 퍼즐 가져오기
     */
    @Transactional
    public NurikabePuzzle getTodayPuzzle() {
        String dateString = LocalDate.now().toString();
        String dateHash = generateHash(dateString + "nurikabe-daily");

        Optional<NurikabePuzzle> existingPuzzle = puzzleRepository.findByPuzzleHash(dateHash);
        if (existingPuzzle.isPresent()) {
            NurikabePuzzle puzzle = existingPuzzle.get();
            puzzle.setPlayCount(puzzle.getPlayCount() + 1);
            return puzzleRepository.save(puzzle);
        }

        // 새 퍼즐 생성
        PuzzleData puzzleData = generatePuzzle(DEFAULT_GRID_SIZE, dateHash);

        NurikabePuzzle puzzle = NurikabePuzzle.builder()
                .puzzleHash(dateHash)
                .initialBoard(boardToJson(puzzleData.board))
                .solution(solutionToJson(puzzleData.seaCells))
                .gridSize(DEFAULT_GRID_SIZE)
                .difficulty("medium")
                .playCount(1)
                .completionCount(0)
                .build();

        log.info("오늘의 Nurikabe 퍼즐 생성: {}", dateHash);
        return puzzleRepository.save(puzzle);
    }

    /**
     * 게임 시작
     */
    @Transactional
    public Map<String, Object> startGame(Long playerId) {
        Player player = playerService.getPlayerEntityById(playerId);

        // 하루 1게임 제한 체크
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        List<NurikabeGameSession> todayGames = sessionRepository.findTodayCompletedByPlayer(player, startOfDay);
        if (!todayGames.isEmpty()) {
            throw new RuntimeException("DAILY_LIMIT_REACHED");
        }

        NurikabePuzzle puzzle = getTodayPuzzle();

        // 기존 미완료 세션 삭제
        sessionRepository.findByPlayerAndNurikabePuzzle(player, puzzle)
                .ifPresent(existing -> {
                    if (!existing.getIsCompleted()) {
                        sessionRepository.delete(existing);
                    }
                });

        NurikabeGameSession session = NurikabeGameSession.builder()
                .player(player)
                .nurikabePuzzle(puzzle)
                .isCompleted(false)
                .hintsUsed(0)
                .mistakes(0)
                .build();

        session = sessionRepository.save(session);

        Map<String, Object> result = new HashMap<>();
        result.put("sessionId", session.getId());
        result.put("puzzleId", puzzle.getId());
        result.put("gridSize", puzzle.getGridSize());
        result.put("board", jsonToBoard(puzzle.getInitialBoard()));
        result.put("difficulty", puzzle.getDifficulty());

        return result;
    }

    /**
     * 정답 확인
     */
    @Transactional
    public Map<String, Object> checkSolution(Long sessionId, String playerSolutionJson) {
        NurikabeGameSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("세션을 찾을 수 없습니다"));

        if (session.getIsCompleted()) {
            throw new RuntimeException("이미 완료된 게임입니다");
        }

        Set<String> correctSolution = jsonToSolution(session.getNurikabePuzzle().getSolution());
        Set<String> playerSolution = jsonToSolution(playerSolutionJson);

        boolean isCorrect = correctSolution.equals(playerSolution);

        Map<String, Object> result = new HashMap<>();
        result.put("isCorrect", isCorrect);

        if (!isCorrect) {
            session.setMistakes(session.getMistakes() + 1);
            sessionRepository.save(session);
            result.put("mistakes", session.getMistakes());
        }

        return result;
    }

    /**
     * 게임 완료
     */
    @Transactional
    public Map<String, Object> completeGame(Long sessionId, String playerSolutionJson, int timeSeconds) {
        NurikabeGameSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("세션을 찾을 수 없습니다"));

        if (session.getIsCompleted()) {
            throw new RuntimeException("이미 완료된 게임입니다");
        }

        // 점수 계산
        int baseScore = 1000;
        int timeDeduction = Math.min(timeSeconds * 2, 500);
        int hintDeduction = session.getHintsUsed() * 50;
        int mistakeDeduction = session.getMistakes() * 30;
        int finalScore = Math.max(baseScore - timeDeduction - hintDeduction - mistakeDeduction, 100);

        session.setIsCompleted(true);
        session.setCompletedAt(LocalDateTime.now());
        session.setPlayerSolution(playerSolutionJson);
        session.setTimeSeconds(timeSeconds);
        session.setFinalScore(finalScore);

        // 순위 계산
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        List<NurikabeGameSession> rankings = sessionRepository.findTodayRanking(startOfDay);
        int rank = 1;
        for (NurikabeGameSession s : rankings) {
            if (s.getFinalScore() > finalScore) {
                rank++;
            }
        }
        session.setRank(rank);

        sessionRepository.save(session);

        // 퍼즐 통계 업데이트
        NurikabePuzzle puzzle = session.getNurikabePuzzle();
        puzzle.setCompletionCount(puzzle.getCompletionCount() + 1);
        if (puzzle.getBestTime() == null || timeSeconds < puzzle.getBestTime()) {
            puzzle.setBestTime(timeSeconds);
        }
        puzzleRepository.save(puzzle);

        Map<String, Object> result = new HashMap<>();
        result.put("finalScore", finalScore);
        result.put("timeSeconds", timeSeconds);
        result.put("hintsUsed", session.getHintsUsed());
        result.put("mistakes", session.getMistakes());
        result.put("rank", rank);

        return result;
    }

    /**
     * 힌트 사용
     */
    @Transactional
    public Map<String, Object> useHint(Long sessionId) {
        NurikabeGameSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("세션을 찾을 수 없습니다"));

        session.setHintsUsed(session.getHintsUsed() + 1);
        sessionRepository.save(session);

        // 정답에서 하나의 바다 셀 위치 반환
        Set<String> solution = jsonToSolution(session.getNurikabePuzzle().getSolution());
        String hint = solution.stream().skip(new Random().nextInt(solution.size())).findFirst().orElse(null);

        Map<String, Object> result = new HashMap<>();
        result.put("hint", hint);
        result.put("hintsUsed", session.getHintsUsed());

        return result;
    }

    /**
     * 오늘의 플레이 상태 확인
     */
    @Transactional(readOnly = true)
    public Map<String, Object> checkDailyStatus(Long playerId) {
        Player player = playerService.getPlayerEntityById(playerId);
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        List<NurikabeGameSession> todayGames = sessionRepository.findTodayCompletedByPlayer(player, startOfDay);

        Map<String, Object> result = new HashMap<>();
        result.put("canPlay", todayGames.isEmpty());
        result.put("playedToday", !todayGames.isEmpty());

        if (!todayGames.isEmpty()) {
            NurikabeGameSession todayGame = todayGames.get(0);
            result.put("todayScore", todayGame.getFinalScore());
            result.put("todayRank", todayGame.getRank());
            result.put("timeSeconds", todayGame.getTimeSeconds());
        }

        return result;
    }

    /**
     * 오늘의 랭킹
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTodayRanking(int limit) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        List<NurikabeGameSession> rankings = sessionRepository.findTodayRanking(startOfDay);

        List<Map<String, Object>> result = new ArrayList<>();
        int rank = 1;
        for (NurikabeGameSession session : rankings) {
            if (rank > limit) break;

            Map<String, Object> entry = new HashMap<>();
            entry.put("rank", rank);
            entry.put("playerId", session.getPlayer().getId());
            entry.put("nickname", session.getPlayer().getNickname());
            entry.put("avatarId", session.getPlayer().getAvatarId());
            entry.put("avatarColor", session.getPlayer().getAvatarColor());
            entry.put("score", session.getFinalScore());
            entry.put("timeSeconds", session.getTimeSeconds());
            result.add(entry);
            rank++;
        }

        return result;
    }

    // === Puzzle Generation ===

    private static class PuzzleData {
        int[][] board;
        Set<String> seaCells;

        PuzzleData(int[][] board, Set<String> seaCells) {
            this.board = board;
            this.seaCells = seaCells;
        }
    }

    private PuzzleData generatePuzzle(int size, String seed) {
        Random random = new Random(seed.hashCode());
        int[][] board = new int[size][size];
        Set<String> seaCells = new HashSet<>();
        Set<String> islandCells = new HashSet<>();

        // 1. 먼저 섬들을 배치 (숫자가 있는 셀)
        List<int[]> islands = new ArrayList<>();
        int numIslands = 4 + random.nextInt(3); // 4-6개 섬

        for (int i = 0; i < numIslands; i++) {
            int attempts = 0;
            while (attempts < 100) {
                int row = random.nextInt(size);
                int col = random.nextInt(size);
                int islandSize = 2 + random.nextInt(4); // 2-5 크기

                if (canPlaceIsland(board, islandCells, row, col, size)) {
                    // 섬 확장
                    Set<String> thisIsland = expandIsland(board, islandCells, row, col, islandSize, size, random);
                    if (thisIsland.size() >= 2) {
                        board[row][col] = thisIsland.size();
                        islandCells.addAll(thisIsland);
                        islands.add(new int[]{row, col, thisIsland.size()});
                        break;
                    }
                }
                attempts++;
            }
        }

        // 2. 나머지 셀은 바다
        for (int i = 0; i < size; i++) {
            for (int j = 0; j < size; j++) {
                String key = i + "," + j;
                if (!islandCells.contains(key)) {
                    seaCells.add(key);
                }
            }
        }

        // 3. 바다가 연결되어 있고 2x2 블록이 없는지 확인, 필요시 조정
        adjustSeaForValidity(board, seaCells, islandCells, size, random);

        return new PuzzleData(board, seaCells);
    }

    private boolean canPlaceIsland(int[][] board, Set<String> islandCells, int row, int col, int size) {
        String key = row + "," + col;
        if (islandCells.contains(key)) return false;
        if (board[row][col] != 0) return false;

        // 인접한 섬이 없어야 함
        int[][] dirs = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};
        for (int[] dir : dirs) {
            int nr = row + dir[0];
            int nc = col + dir[1];
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                if (islandCells.contains(nr + "," + nc)) {
                    return false;
                }
            }
        }
        return true;
    }

    private Set<String> expandIsland(int[][] board, Set<String> existingIslands, int startRow, int startCol,
                                      int targetSize, int gridSize, Random random) {
        Set<String> island = new HashSet<>();
        island.add(startRow + "," + startCol);

        int[][] dirs = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};

        while (island.size() < targetSize) {
            List<String> candidates = new ArrayList<>();

            for (String cell : island) {
                String[] parts = cell.split(",");
                int row = Integer.parseInt(parts[0]);
                int col = Integer.parseInt(parts[1]);

                for (int[] dir : dirs) {
                    int nr = row + dir[0];
                    int nc = col + dir[1];
                    String key = nr + "," + nc;

                    if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize &&
                        !island.contains(key) && !existingIslands.contains(key) &&
                        !touchesOtherIsland(key, island, existingIslands, gridSize)) {
                        candidates.add(key);
                    }
                }
            }

            if (candidates.isEmpty()) break;

            String chosen = candidates.get(random.nextInt(candidates.size()));
            island.add(chosen);
        }

        return island;
    }

    private boolean touchesOtherIsland(String cell, Set<String> currentIsland, Set<String> existingIslands, int size) {
        String[] parts = cell.split(",");
        int row = Integer.parseInt(parts[0]);
        int col = Integer.parseInt(parts[1]);

        int[][] dirs = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};
        for (int[] dir : dirs) {
            int nr = row + dir[0];
            int nc = col + dir[1];
            String key = nr + "," + nc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                if (existingIslands.contains(key) && !currentIsland.contains(key)) {
                    return true;
                }
            }
        }
        return false;
    }

    private void adjustSeaForValidity(int[][] board, Set<String> seaCells, Set<String> islandCells, int size, Random random) {
        // 2x2 바다 블록 제거
        for (int i = 0; i < size - 1; i++) {
            for (int j = 0; j < size - 1; j++) {
                String c1 = i + "," + j;
                String c2 = i + "," + (j+1);
                String c3 = (i+1) + "," + j;
                String c4 = (i+1) + "," + (j+1);

                if (seaCells.contains(c1) && seaCells.contains(c2) &&
                    seaCells.contains(c3) && seaCells.contains(c4)) {
                    // 하나를 섬으로 변경
                    String toConvert = c1;
                    seaCells.remove(toConvert);
                    islandCells.add(toConvert);
                    String[] parts = toConvert.split(",");
                    board[Integer.parseInt(parts[0])][Integer.parseInt(parts[1])] = 1;
                }
            }
        }
    }

    // === Helper Methods ===

    private String generateHash(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes());
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString().substring(0, 16);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("해시 생성 실패", e);
        }
    }

    private String boardToJson(int[][] board) {
        try {
            return objectMapper.writeValueAsString(board);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON 변환 실패", e);
        }
    }

    private int[][] jsonToBoard(String json) {
        try {
            return objectMapper.readValue(json, int[][].class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON 파싱 실패", e);
        }
    }

    private String solutionToJson(Set<String> solution) {
        try {
            return objectMapper.writeValueAsString(solution);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON 변환 실패", e);
        }
    }

    private Set<String> jsonToSolution(String json) {
        try {
            List<String> list = objectMapper.readValue(json, List.class);
            return new HashSet<>(list);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON 파싱 실패", e);
        }
    }
}

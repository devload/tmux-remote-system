package com.sudoku.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sudoku.entity.HitoriGameSession;
import com.sudoku.entity.HitoriPuzzle;
import com.sudoku.entity.Player;
import com.sudoku.repository.HitoriGameSessionRepository;
import com.sudoku.repository.HitoriPuzzleRepository;
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
public class HitoriService {

    private final HitoriPuzzleRepository puzzleRepository;
    private final HitoriGameSessionRepository sessionRepository;
    private final PlayerService playerService;
    private final ObjectMapper objectMapper;

    private static final int DEFAULT_GRID_SIZE = 5;

    /**
     * 오늘의 Hitori 퍼즐 가져오기
     */
    @Transactional
    public HitoriPuzzle getTodayPuzzle() {
        String dateString = LocalDate.now().toString();
        String dateHash = generateHash(dateString + "hitori-daily");

        Optional<HitoriPuzzle> existingPuzzle = puzzleRepository.findByPuzzleHash(dateHash);
        if (existingPuzzle.isPresent()) {
            HitoriPuzzle puzzle = existingPuzzle.get();
            puzzle.setPlayCount(puzzle.getPlayCount() + 1);
            return puzzleRepository.save(puzzle);
        }

        // 새 퍼즐 생성
        int[][] board = generatePuzzle(DEFAULT_GRID_SIZE, dateHash);
        Set<String> solution = solvePuzzle(board);

        HitoriPuzzle puzzle = HitoriPuzzle.builder()
                .puzzleHash(dateHash)
                .initialBoard(boardToJson(board))
                .solution(solutionToJson(solution))
                .gridSize(DEFAULT_GRID_SIZE)
                .difficulty("medium")
                .playCount(1)
                .completionCount(0)
                .build();

        log.info("오늘의 Hitori 퍼즐 생성: {}", dateHash);
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
        List<HitoriGameSession> todayGames = sessionRepository.findTodayCompletedByPlayer(player, startOfDay);
        if (!todayGames.isEmpty()) {
            throw new RuntimeException("DAILY_LIMIT_REACHED");
        }

        HitoriPuzzle puzzle = getTodayPuzzle();

        // 기존 미완료 세션 삭제
        sessionRepository.findByPlayerAndHitoriPuzzle(player, puzzle)
                .ifPresent(existing -> {
                    if (!existing.getIsCompleted()) {
                        sessionRepository.delete(existing);
                    }
                });

        HitoriGameSession session = HitoriGameSession.builder()
                .player(player)
                .hitoriPuzzle(puzzle)
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
        HitoriGameSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("세션을 찾을 수 없습니다"));

        if (session.getIsCompleted()) {
            throw new RuntimeException("이미 완료된 게임입니다");
        }

        Set<String> correctSolution = jsonToSolution(session.getHitoriPuzzle().getSolution());
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
        HitoriGameSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("세션을 찾을 수 없습니다"));

        if (session.getIsCompleted()) {
            throw new RuntimeException("이미 완료된 게임입니다");
        }

        // 점수 계산: 기본 1000점 - (시간 * 2) - (힌트 * 50) - (실수 * 30)
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
        List<HitoriGameSession> rankings = sessionRepository.findTodayRanking(startOfDay);
        int rank = 1;
        for (HitoriGameSession s : rankings) {
            if (s.getFinalScore() > finalScore) {
                rank++;
            }
        }
        session.setRank(rank);

        sessionRepository.save(session);

        // 퍼즐 통계 업데이트
        HitoriPuzzle puzzle = session.getHitoriPuzzle();
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
        HitoriGameSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("세션을 찾을 수 없습니다"));

        session.setHintsUsed(session.getHintsUsed() + 1);
        sessionRepository.save(session);

        // 정답에서 하나의 검은 셀 위치 반환
        Set<String> solution = jsonToSolution(session.getHitoriPuzzle().getSolution());
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

        List<HitoriGameSession> todayGames = sessionRepository.findTodayCompletedByPlayer(player, startOfDay);

        Map<String, Object> result = new HashMap<>();
        result.put("canPlay", todayGames.isEmpty());
        result.put("playedToday", !todayGames.isEmpty());

        if (!todayGames.isEmpty()) {
            HitoriGameSession todayGame = todayGames.get(0);
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
        List<HitoriGameSession> rankings = sessionRepository.findTodayRanking(startOfDay);

        List<Map<String, Object>> result = new ArrayList<>();
        int rank = 1;
        for (HitoriGameSession session : rankings) {
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

    private int[][] generatePuzzle(int size, String seed) {
        Random random = new Random(seed.hashCode());
        int[][] board = new int[size][size];

        // 1. 유효한 라틴 방진 생성 (각 행/열에 1~size가 한번씩)
        for (int i = 0; i < size; i++) {
            for (int j = 0; j < size; j++) {
                board[i][j] = (i + j) % size + 1;
            }
        }

        // 2. 행 셔플
        for (int i = size - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            int[] temp = board[i];
            board[i] = board[j];
            board[j] = temp;
        }

        // 3. 열 셔플
        for (int i = size - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            for (int k = 0; k < size; k++) {
                int temp = board[k][i];
                board[k][i] = board[k][j];
                board[k][j] = temp;
            }
        }

        // 4. 일부 셀을 중복값으로 변경 (퍼즐 만들기)
        int duplicates = size + random.nextInt(size);
        for (int d = 0; d < duplicates; d++) {
            int row = random.nextInt(size);
            int col = random.nextInt(size);
            int newVal = random.nextInt(size) + 1;
            board[row][col] = newVal;
        }

        return board;
    }

    private Set<String> solvePuzzle(int[][] board) {
        int size = board.length;
        Set<String> blackCells = new HashSet<>();

        // 간단한 휴리스틱 솔버
        boolean changed;
        do {
            changed = false;

            // 각 행에서 중복 찾기
            for (int i = 0; i < size; i++) {
                Map<Integer, List<Integer>> valuePositions = new HashMap<>();
                for (int j = 0; j < size; j++) {
                    String key = i + "," + j;
                    if (blackCells.contains(key)) continue;

                    int val = board[i][j];
                    valuePositions.computeIfAbsent(val, k -> new ArrayList<>()).add(j);
                }

                for (Map.Entry<Integer, List<Integer>> entry : valuePositions.entrySet()) {
                    List<Integer> positions = entry.getValue();
                    if (positions.size() > 1) {
                        // 첫번째 빼고 나머지 블랙
                        for (int p = 1; p < positions.size(); p++) {
                            String key = i + "," + positions.get(p);
                            if (!blackCells.contains(key)) {
                                // 인접 검사
                                if (canMarkBlack(blackCells, i, positions.get(p), size)) {
                                    blackCells.add(key);
                                    changed = true;
                                }
                            }
                        }
                    }
                }
            }

            // 각 열에서 중복 찾기
            for (int j = 0; j < size; j++) {
                Map<Integer, List<Integer>> valuePositions = new HashMap<>();
                for (int i = 0; i < size; i++) {
                    String key = i + "," + j;
                    if (blackCells.contains(key)) continue;

                    int val = board[i][j];
                    valuePositions.computeIfAbsent(val, k -> new ArrayList<>()).add(i);
                }

                for (Map.Entry<Integer, List<Integer>> entry : valuePositions.entrySet()) {
                    List<Integer> positions = entry.getValue();
                    if (positions.size() > 1) {
                        for (int p = 1; p < positions.size(); p++) {
                            String key = positions.get(p) + "," + j;
                            if (!blackCells.contains(key)) {
                                if (canMarkBlack(blackCells, positions.get(p), j, size)) {
                                    blackCells.add(key);
                                    changed = true;
                                }
                            }
                        }
                    }
                }
            }
        } while (changed);

        return blackCells;
    }

    private boolean canMarkBlack(Set<String> blackCells, int row, int col, int size) {
        // 인접 셀에 블랙이 있으면 안됨
        int[][] dirs = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};
        for (int[] dir : dirs) {
            int nr = row + dir[0];
            int nc = col + dir[1];
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                if (blackCells.contains(nr + "," + nc)) {
                    return false;
                }
            }
        }
        return true;
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

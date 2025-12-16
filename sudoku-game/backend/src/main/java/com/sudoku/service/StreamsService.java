package com.sudoku.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sudoku.entity.Player;
import com.sudoku.entity.StreamsGameSession;
import com.sudoku.entity.StreamsPuzzle;
import com.sudoku.repository.StreamsGameSessionRepository;
import com.sudoku.repository.StreamsPuzzleRepository;
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
public class StreamsService {

    private final StreamsPuzzleRepository puzzleRepository;
    private final StreamsGameSessionRepository sessionRepository;
    private final PlayerService playerService;
    private final ObjectMapper objectMapper;

    private static final int GRID_ROWS = 4;
    private static final int GRID_COLS = 5;
    private static final int TOTAL_NUMBERS = 20;

    /**
     * 오늘의 Streams 퍼즐 가져오기
     */
    @Transactional
    public StreamsPuzzle getTodayPuzzle() {
        String dateString = LocalDate.now().toString();
        String dateHash = generateHash(dateString + "streams-daily");

        Optional<StreamsPuzzle> existingPuzzle = puzzleRepository.findByPuzzleHash(dateHash);
        if (existingPuzzle.isPresent()) {
            StreamsPuzzle puzzle = existingPuzzle.get();
            puzzle.setPlayCount(puzzle.getPlayCount() + 1);
            return puzzleRepository.save(puzzle);
        }

        // 새 퍼즐 생성 - 날짜 기반 시드로 숫자 순서 결정
        int[] numberSequence = generateNumberSequence(dateHash);

        StreamsPuzzle puzzle = StreamsPuzzle.builder()
                .puzzleHash(dateHash)
                .numberSequence(arrayToJson(numberSequence))
                .gridSize(TOTAL_NUMBERS)
                .gridRows(GRID_ROWS)
                .gridCols(GRID_COLS)
                .playCount(1)
                .completionCount(0)
                .build();

        log.info("오늘의 Streams 퍼즐 생성: {}", dateHash);
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
        List<StreamsGameSession> todayGames = sessionRepository.findTodayCompletedByPlayer(player, startOfDay);
        if (!todayGames.isEmpty()) {
            throw new RuntimeException("DAILY_LIMIT_REACHED");
        }

        StreamsPuzzle puzzle = getTodayPuzzle();

        // 기존 미완료 세션 삭제
        sessionRepository.findByPlayerAndStreamsPuzzle(player, puzzle)
                .ifPresent(existing -> {
                    if (!existing.getIsCompleted()) {
                        sessionRepository.delete(existing);
                    }
                });

        StreamsGameSession session = StreamsGameSession.builder()
                .player(player)
                .streamsPuzzle(puzzle)
                .isCompleted(false)
                .build();

        session = sessionRepository.save(session);

        Map<String, Object> result = new HashMap<>();
        result.put("sessionId", session.getId());
        result.put("puzzleId", puzzle.getId());
        result.put("gridRows", puzzle.getGridRows());
        result.put("gridCols", puzzle.getGridCols());
        result.put("totalNumbers", TOTAL_NUMBERS);
        // 숫자 순서는 클라이언트에서 하나씩 요청

        return result;
    }

    /**
     * 다음 숫자 가져오기
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getNextNumber(Long sessionId, int currentIndex) {
        StreamsGameSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("세션을 찾을 수 없습니다"));

        if (session.getIsCompleted()) {
            throw new RuntimeException("이미 완료된 게임입니다");
        }

        int[] sequence = jsonToArray(session.getStreamsPuzzle().getNumberSequence());

        Map<String, Object> result = new HashMap<>();
        if (currentIndex < sequence.length) {
            result.put("number", sequence[currentIndex]);
            result.put("index", currentIndex);
            result.put("isLast", currentIndex == sequence.length - 1);
        } else {
            result.put("number", null);
            result.put("isLast", true);
        }

        return result;
    }

    /**
     * 게임 완료
     */
    @Transactional
    public Map<String, Object> completeGame(Long sessionId, String placementsJson) {
        StreamsGameSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("세션을 찾을 수 없습니다"));

        if (session.getIsCompleted()) {
            throw new RuntimeException("이미 완료된 게임입니다");
        }

        // 점수 계산
        int[] sequence = jsonToArray(session.getStreamsPuzzle().getNumberSequence());
        int[][] board = reconstructBoard(placementsJson, session.getStreamsPuzzle().getGridRows(),
                session.getStreamsPuzzle().getGridCols());

        ScoreResult scoreResult = calculateScore(board);

        session.setIsCompleted(true);
        session.setCompletedAt(LocalDateTime.now());
        session.setPlacements(placementsJson);
        session.setFinalScore(scoreResult.totalScore);
        session.setLongestStream(scoreResult.longestStream);

        // 순위 계산
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        List<StreamsGameSession> rankings = sessionRepository.findTodayRanking(startOfDay);
        int rank = 1;
        for (StreamsGameSession s : rankings) {
            if (s.getFinalScore() > scoreResult.totalScore) {
                rank++;
            }
        }
        session.setRank(rank);

        sessionRepository.save(session);

        // 퍼즐 통계 업데이트
        StreamsPuzzle puzzle = session.getStreamsPuzzle();
        puzzle.setCompletionCount(puzzle.getCompletionCount() + 1);
        if (puzzle.getBestScore() == null || scoreResult.totalScore > puzzle.getBestScore()) {
            puzzle.setBestScore(scoreResult.totalScore);
        }
        puzzleRepository.save(puzzle);

        Map<String, Object> result = new HashMap<>();
        result.put("finalScore", scoreResult.totalScore);
        result.put("longestStream", scoreResult.longestStream);
        result.put("streamDetails", scoreResult.streamDetails);
        result.put("rank", rank);

        return result;
    }

    /**
     * 오늘의 플레이 상태 확인
     */
    @Transactional(readOnly = true)
    public Map<String, Object> checkDailyStatus(Long playerId) {
        Player player = playerService.getPlayerEntityById(playerId);
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        List<StreamsGameSession> todayGames = sessionRepository.findTodayCompletedByPlayer(player, startOfDay);

        Map<String, Object> result = new HashMap<>();
        result.put("canPlay", todayGames.isEmpty());
        result.put("playedToday", !todayGames.isEmpty());

        if (!todayGames.isEmpty()) {
            StreamsGameSession todayGame = todayGames.get(0);
            result.put("todayScore", todayGame.getFinalScore());
            result.put("todayRank", todayGame.getRank());
            result.put("longestStream", todayGame.getLongestStream());
        }

        return result;
    }

    /**
     * 오늘의 랭킹
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTodayRanking(int limit) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        List<StreamsGameSession> rankings = sessionRepository.findTodayRanking(startOfDay);

        List<Map<String, Object>> result = new ArrayList<>();
        int rank = 1;
        for (StreamsGameSession session : rankings) {
            if (rank > limit) break;

            Map<String, Object> entry = new HashMap<>();
            entry.put("rank", rank);
            entry.put("playerId", session.getPlayer().getId());
            entry.put("nickname", session.getPlayer().getNickname());
            entry.put("avatarId", session.getPlayer().getAvatarId());
            entry.put("avatarColor", session.getPlayer().getAvatarColor());
            entry.put("score", session.getFinalScore());
            entry.put("longestStream", session.getLongestStream());
            result.add(entry);
            rank++;
        }

        return result;
    }

    /**
     * 고스트 데이터 (다른 플레이어 배치 순서)
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getGhostData(Long puzzleId) {
        List<StreamsGameSession> sessions = sessionRepository.findCompletedByPuzzle(puzzleId);

        List<Map<String, Object>> ghostPlayers = new ArrayList<>();
        for (StreamsGameSession session : sessions.stream().limit(5).toList()) {
            Map<String, Object> ghost = new HashMap<>();
            ghost.put("playerId", session.getPlayer().getId());
            ghost.put("nickname", session.getPlayer().getNickname());
            ghost.put("avatarId", session.getPlayer().getAvatarId());
            ghost.put("avatarColor", session.getPlayer().getAvatarColor());
            ghost.put("score", session.getFinalScore());
            ghost.put("placements", session.getPlacements());
            ghostPlayers.add(ghost);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("puzzleId", puzzleId);
        result.put("totalPlayers", sessions.size());
        result.put("ghostPlayers", ghostPlayers);

        return result;
    }

    // === Helper Methods ===

    private int[] generateNumberSequence(String seed) {
        // 시드 기반으로 1-20 셔플
        int[] numbers = new int[TOTAL_NUMBERS];
        for (int i = 0; i < TOTAL_NUMBERS; i++) {
            numbers[i] = i + 1;
        }

        // 시드 기반 셔플
        Random random = new Random(seed.hashCode());
        for (int i = numbers.length - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            int temp = numbers[i];
            numbers[i] = numbers[j];
            numbers[j] = temp;
        }

        return numbers;
    }

    private int[][] reconstructBoard(String placementsJson, int rows, int cols) {
        int[][] board = new int[rows][cols];

        try {
            List<Map<String, Object>> placements = objectMapper.readValue(placementsJson, List.class);
            for (Map<String, Object> p : placements) {
                int row = (Integer) p.get("row");
                int col = (Integer) p.get("col");
                int number = (Integer) p.get("number");
                board[row][col] = number;
            }
        } catch (Exception e) {
            log.error("배치 파싱 실패", e);
        }

        return board;
    }

    private ScoreResult calculateScore(int[][] board) {
        int rows = board.length;
        int cols = board[0].length;
        boolean[][] visited = new boolean[rows][cols];
        int totalScore = 0;
        int longestStream = 0;
        List<Map<String, Object>> streamDetails = new ArrayList<>();

        // 각 숫자를 시작점으로 스트림 찾기
        for (int num = 1; num <= TOTAL_NUMBERS; num++) {
            int[] pos = findNumber(board, num);
            if (pos == null) continue;

            // 이 숫자에서 시작하는 연속 스트림 찾기
            List<int[]> stream = new ArrayList<>();
            stream.add(pos);

            int currentNum = num;
            int[] currentPos = pos;

            while (currentNum < TOTAL_NUMBERS) {
                int nextNum = currentNum + 1;
                int[] nextPos = findAdjacentNumber(board, currentPos, nextNum);

                if (nextPos != null) {
                    stream.add(nextPos);
                    currentNum = nextNum;
                    currentPos = nextPos;
                } else {
                    break;
                }
            }

            if (stream.size() >= 2) {
                int streamScore = calculateStreamScore(stream.size());
                totalScore += streamScore;
                longestStream = Math.max(longestStream, stream.size());

                Map<String, Object> detail = new HashMap<>();
                detail.put("start", num);
                detail.put("end", num + stream.size() - 1);
                detail.put("length", stream.size());
                detail.put("score", streamScore);
                streamDetails.add(detail);
            }
        }

        return new ScoreResult(totalScore, longestStream, streamDetails);
    }

    private int[] findNumber(int[][] board, int number) {
        for (int r = 0; r < board.length; r++) {
            for (int c = 0; c < board[0].length; c++) {
                if (board[r][c] == number) {
                    return new int[]{r, c};
                }
            }
        }
        return null;
    }

    private int[] findAdjacentNumber(int[][] board, int[] pos, int number) {
        int[][] directions = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};  // 상하좌우

        for (int[] dir : directions) {
            int newRow = pos[0] + dir[0];
            int newCol = pos[1] + dir[1];

            if (newRow >= 0 && newRow < board.length &&
                newCol >= 0 && newCol < board[0].length &&
                board[newRow][newCol] == number) {
                return new int[]{newRow, newCol};
            }
        }

        return null;
    }

    private int calculateStreamScore(int length) {
        // 스트림 길이별 점수 (삼각수)
        // 2: 1, 3: 3, 4: 6, 5: 10, 6: 15, ...
        if (length < 2) return 0;
        int n = length - 1;
        return n * (n + 1) / 2;
    }

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

    private String arrayToJson(int[] array) {
        try {
            return objectMapper.writeValueAsString(array);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON 변환 실패", e);
        }
    }

    private int[] jsonToArray(String json) {
        try {
            return objectMapper.readValue(json, int[].class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON 파싱 실패", e);
        }
    }

    private static class ScoreResult {
        int totalScore;
        int longestStream;
        List<Map<String, Object>> streamDetails;

        ScoreResult(int totalScore, int longestStream, List<Map<String, Object>> streamDetails) {
            this.totalScore = totalScore;
            this.longestStream = longestStream;
            this.streamDetails = streamDetails;
        }
    }
}

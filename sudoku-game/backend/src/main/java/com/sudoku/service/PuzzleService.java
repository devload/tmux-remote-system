package com.sudoku.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sudoku.dto.PuzzleDto;
import com.sudoku.entity.Puzzle;
import com.sudoku.repository.PuzzleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PuzzleService {

    private final PuzzleRepository puzzleRepository;
    private final ObjectMapper objectMapper;

    private static final int GRID_SIZE = 6;
    private static final int BOX_ROWS = 2;
    private static final int BOX_COLS = 3;

    @Transactional
    public PuzzleDto getOrCreatePuzzle(Puzzle.Difficulty difficulty) {
        // 기존 퍼즐 중 랜덤 선택 또는 새로 생성
        List<Puzzle> puzzles = puzzleRepository.findRandomByDifficulty(difficulty);

        Puzzle puzzle;
        if (!puzzles.isEmpty() && Math.random() > 0.3) {
            // 70% 확률로 기존 퍼즐 사용
            puzzle = puzzles.get(0);
        } else {
            // 30% 확률로 새 퍼즐 생성
            puzzle = generateNewPuzzle(difficulty);
        }

        puzzle.setPlayCount(puzzle.getPlayCount() + 1);
        puzzleRepository.save(puzzle);

        return toDto(puzzle);
    }

    @Transactional
    public PuzzleDto getPuzzleById(Long puzzleId) {
        Puzzle puzzle = puzzleRepository.findById(puzzleId)
                .orElseThrow(() -> new RuntimeException("퍼즐을 찾을 수 없습니다: " + puzzleId));
        return toDto(puzzle);
    }

    @Transactional
    public Puzzle getPuzzleEntityById(Long puzzleId) {
        return puzzleRepository.findById(puzzleId)
                .orElseThrow(() -> new RuntimeException("퍼즐을 찾을 수 없습니다: " + puzzleId));
    }

    /**
     * 오늘의 퍼즐 가져오기 - 날짜 기반으로 동일한 퍼즐 반환
     * 모든 플레이어가 같은 날에는 같은 퍼즐을 플레이
     */
    @Transactional
    public Puzzle getTodayPuzzle() {
        // 날짜 기반 해시로 퍼즐 ID 결정
        String dateString = LocalDate.now().toString();
        String dateHash = generateHash(dateString + "sudoku-daily");

        // 해당 해시로 퍼즐 찾기
        Optional<Puzzle> existingPuzzle = puzzleRepository.findByPuzzleHash(dateHash);
        if (existingPuzzle.isPresent()) {
            Puzzle puzzle = existingPuzzle.get();
            puzzle.setPlayCount(puzzle.getPlayCount() + 1);
            return puzzleRepository.save(puzzle);
        }

        // 없으면 오늘의 퍼즐 생성 (날짜 기반 랜덤 난이도)
        Puzzle.Difficulty[] difficulties = Puzzle.Difficulty.values();
        int difficultyIndex = Math.abs(dateHash.hashCode()) % difficulties.length;
        Puzzle.Difficulty todayDifficulty = difficulties[difficultyIndex];

        int[][] solution = generateSolution();
        int[][] initialBoard = createPuzzle(solution, todayDifficulty);

        String solutionJson = boardToJson(solution);
        String initialBoardJson = boardToJson(initialBoard);

        Puzzle puzzle = Puzzle.builder()
                .puzzleHash(dateHash)
                .difficulty(todayDifficulty)
                .initialBoard(initialBoardJson)
                .solution(solutionJson)
                .playCount(1)
                .completionCount(0)
                .build();

        log.info("오늘의 퍼즐 생성: {} (난이도: {})", dateHash, todayDifficulty);
        return puzzleRepository.save(puzzle);
    }

    private Puzzle generateNewPuzzle(Puzzle.Difficulty difficulty) {
        int[][] solution = generateSolution();
        int[][] initialBoard = createPuzzle(solution, difficulty);

        String solutionJson = boardToJson(solution);
        String initialBoardJson = boardToJson(initialBoard);
        String puzzleHash = generateHash(initialBoardJson);

        // 동일한 퍼즐이 있으면 재생성
        while (puzzleRepository.existsByPuzzleHash(puzzleHash)) {
            solution = generateSolution();
            initialBoard = createPuzzle(solution, difficulty);
            solutionJson = boardToJson(solution);
            initialBoardJson = boardToJson(initialBoard);
            puzzleHash = generateHash(initialBoardJson);
        }

        Puzzle puzzle = Puzzle.builder()
                .puzzleHash(puzzleHash)
                .difficulty(difficulty)
                .initialBoard(initialBoardJson)
                .solution(solutionJson)
                .playCount(0)
                .completionCount(0)
                .build();

        return puzzleRepository.save(puzzle);
    }

    private int[][] generateSolution() {
        int[][] grid = new int[GRID_SIZE][GRID_SIZE];
        solveSudoku(grid);
        return grid;
    }

    private boolean solveSudoku(int[][] grid) {
        int[] emptyCell = findEmptyCell(grid);
        if (emptyCell == null) return true;

        int row = emptyCell[0];
        int col = emptyCell[1];
        List<Integer> numbers = new ArrayList<>(Arrays.asList(1, 2, 3, 4, 5, 6));
        Collections.shuffle(numbers);

        for (int num : numbers) {
            if (isValidPlacement(grid, row, col, num)) {
                grid[row][col] = num;
                if (solveSudoku(grid)) return true;
                grid[row][col] = 0;
            }
        }
        return false;
    }

    private int[] findEmptyCell(int[][] grid) {
        for (int row = 0; row < GRID_SIZE; row++) {
            for (int col = 0; col < GRID_SIZE; col++) {
                if (grid[row][col] == 0) return new int[]{row, col};
            }
        }
        return null;
    }

    private boolean isValidPlacement(int[][] grid, int row, int col, int num) {
        // Check row
        for (int c = 0; c < GRID_SIZE; c++) {
            if (grid[row][c] == num) return false;
        }

        // Check column
        for (int r = 0; r < GRID_SIZE; r++) {
            if (grid[r][col] == num) return false;
        }

        // Check 2x3 box
        int boxRow = (row / BOX_ROWS) * BOX_ROWS;
        int boxCol = (col / BOX_COLS) * BOX_COLS;
        for (int r = 0; r < BOX_ROWS; r++) {
            for (int c = 0; c < BOX_COLS; c++) {
                if (grid[boxRow + r][boxCol + c] == num) return false;
            }
        }

        return true;
    }

    private int[][] createPuzzle(int[][] solution, Puzzle.Difficulty difficulty) {
        int cellsToRemove = switch (difficulty) {
            case EASY -> 12;
            case MEDIUM -> 18;
            case HARD -> 24;
        };

        int[][] puzzle = new int[GRID_SIZE][GRID_SIZE];
        for (int r = 0; r < GRID_SIZE; r++) {
            puzzle[r] = Arrays.copyOf(solution[r], GRID_SIZE);
        }

        List<Integer> positions = new ArrayList<>();
        for (int i = 0; i < GRID_SIZE * GRID_SIZE; i++) positions.add(i);
        Collections.shuffle(positions);

        for (int i = 0; i < cellsToRemove; i++) {
            int pos = positions.get(i);
            int row = pos / GRID_SIZE;
            int col = pos % GRID_SIZE;
            puzzle[row][col] = 0;
        }

        return puzzle;
    }

    private String boardToJson(int[][] board) {
        try {
            return objectMapper.writeValueAsString(board);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("보드 직렬화 실패", e);
        }
    }

    public int[][] jsonToBoard(String json) {
        try {
            return objectMapper.readValue(json, int[][].class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("보드 역직렬화 실패", e);
        }
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

    private PuzzleDto toDto(Puzzle puzzle) {
        return PuzzleDto.builder()
                .id(puzzle.getId())
                .puzzleHash(puzzle.getPuzzleHash())
                .difficulty(puzzle.getDifficulty().name())
                .initialBoard(jsonToBoard(puzzle.getInitialBoard()))
                .playCount(puzzle.getPlayCount())
                .completionCount(puzzle.getCompletionCount())
                .bestTimeSeconds(puzzle.getBestTimeSeconds())
                .build();
    }
}

using UnityEngine;
using System;
using System.Collections.Generic;
using PuzzleBattle.Core;

namespace PuzzleBattle.Games.Nurikabe
{
    /// <summary>
    /// Nurikabe 퍼즐 로직
    /// 규칙:
    /// 1. 숫자 셀은 그 숫자 크기의 "섬"(흰 셀 영역)에 속함
    /// 2. 각 섬에는 정확히 하나의 숫자만 있어야 함
    /// 3. 모든 검은 셀(바다)은 서로 연결되어 있어야 함
    /// 4. 2x2 검은 셀 블록이 있으면 안됨
    /// </summary>
    public class NurikabePuzzle : PuzzleBase
    {
        private int[,] numbers;         // 숫자 셀 (-1 = 빈 셀, 0+ = 섬 크기)
        private CellState[,] state;     // 현재 상태 (Unknown, Sea, Island)
        private CellState[,] solution;  // 정답

        public enum CellState
        {
            Unknown,    // 미정
            Sea,        // 바다 (검은색)
            Island      // 섬 (흰색)
        }

        public int SelectedRow { get; private set; } = -1;
        public int SelectedCol { get; private set; } = -1;

        // 이벤트
        public event Action<int[,]> OnPuzzleGenerated;
        public event Action<int, int, CellState> OnCellStateChanged;
        public event Action<int, int> OnCellSelected;

        private void Awake()
        {
            PuzzleType = PuzzleType.Nurikabe;
        }

        public override void InitializePuzzle(int diff)
        {
            difficulty = diff;
            IsCompleted = false;

            // 난이도에 따른 그리드 크기
            gridSize = difficulty switch
            {
                1 => 5,
                2 => 6,
                3 => 7,
                4 => 8,
                5 => 9,
                _ => 6
            };

            numbers = new int[gridSize, gridSize];
            state = new CellState[gridSize, gridSize];
            solution = new CellState[gridSize, gridSize];

            // 초기화
            for (int i = 0; i < gridSize; i++)
            {
                for (int j = 0; j < gridSize; j++)
                {
                    numbers[i, j] = -1;
                    state[i, j] = CellState.Unknown;
                    solution[i, j] = CellState.Unknown;
                }
            }

            GeneratePuzzle();

            TimerManager.Instance?.StartTimer(GetTimeLimit());
            ScoreManager.Instance?.ResetScore();

            OnPuzzleGenerated?.Invoke(numbers);
        }

        protected override void GeneratePuzzle()
        {
            // 날짜 기반 시드
            int seed = DateTime.Now.Year * 10000 + DateTime.Now.Month * 100 + DateTime.Now.Day;
            seed += difficulty * 100 + 3; // Nurikabe용 오프셋
            System.Random random = new System.Random(seed);

            // 1. 섬 생성
            GenerateIslands(random);

            // 2. 나머지는 바다
            for (int i = 0; i < gridSize; i++)
            {
                for (int j = 0; j < gridSize; j++)
                {
                    if (solution[i, j] == CellState.Unknown)
                    {
                        solution[i, j] = CellState.Sea;
                    }
                }
            }

            // 3. 검증
            if (!ValidateSolutionInternal())
            {
                // 실패하면 재생성
                ClearAll();
                GeneratePuzzle();
                return;
            }

            Debug.Log($"Nurikabe puzzle generated: {gridSize}x{gridSize}");
        }

        private void GenerateIslands(System.Random random)
        {
            // 섬 개수 결정
            int islandCount = gridSize / 2 + random.Next(2);
            int attempts = 0;
            int maxAttempts = 100;

            for (int island = 0; island < islandCount && attempts < maxAttempts; island++)
            {
                attempts++;

                // 섬 크기 (2~5)
                int size = 2 + random.Next(Mathf.Min(4, gridSize - 2));

                // 시작 위치 찾기
                List<(int, int)> candidates = new List<(int, int)>();
                for (int i = 0; i < gridSize; i++)
                {
                    for (int j = 0; j < gridSize; j++)
                    {
                        if (solution[i, j] == CellState.Unknown && !HasAdjacentIsland(i, j))
                        {
                            candidates.Add((i, j));
                        }
                    }
                }

                if (candidates.Count == 0) continue;

                var start = candidates[random.Next(candidates.Count)];
                List<(int, int)> islandCells = new List<(int, int)>();

                // 섬 확장
                if (TryExpandIsland(start.Item1, start.Item2, size, islandCells, random))
                {
                    // 섬 적용
                    foreach (var cell in islandCells)
                    {
                        solution[cell.Item1, cell.Item2] = CellState.Island;
                    }

                    // 숫자 배치 (섬의 한 셀에)
                    var numberCell = islandCells[random.Next(islandCells.Count)];
                    numbers[numberCell.Item1, numberCell.Item2] = size;

                    // 숫자 셀은 바로 섬으로 표시
                    state[numberCell.Item1, numberCell.Item2] = CellState.Island;
                }
                else
                {
                    island--; // 재시도
                }
            }
        }

        private bool TryExpandIsland(int startRow, int startCol, int targetSize, List<(int, int)> cells, System.Random random)
        {
            cells.Clear();
            cells.Add((startRow, startCol));

            bool[,] used = new bool[gridSize, gridSize];
            used[startRow, startCol] = true;

            int[] dRow = { -1, 1, 0, 0 };
            int[] dCol = { 0, 0, -1, 1 };

            while (cells.Count < targetSize)
            {
                // 확장 가능한 셀 찾기
                List<(int, int)> expandable = new List<(int, int)>();

                foreach (var cell in cells)
                {
                    for (int d = 0; d < 4; d++)
                    {
                        int newRow = cell.Item1 + dRow[d];
                        int newCol = cell.Item2 + dCol[d];

                        if (IsValidCell(newRow, newCol) &&
                            !used[newRow, newCol] &&
                            solution[newRow, newCol] == CellState.Unknown &&
                            !HasAdjacentIslandExcept(newRow, newCol, cells))
                        {
                            expandable.Add((newRow, newCol));
                        }
                    }
                }

                if (expandable.Count == 0) return false;

                var next = expandable[random.Next(expandable.Count)];
                cells.Add(next);
                used[next.Item1, next.Item2] = true;
            }

            return true;
        }

        private bool HasAdjacentIsland(int row, int col)
        {
            int[] dRow = { -1, 1, 0, 0 };
            int[] dCol = { 0, 0, -1, 1 };

            for (int d = 0; d < 4; d++)
            {
                int newRow = row + dRow[d];
                int newCol = col + dCol[d];

                if (IsValidCell(newRow, newCol) && solution[newRow, newCol] == CellState.Island)
                {
                    return true;
                }
            }
            return false;
        }

        private bool HasAdjacentIslandExcept(int row, int col, List<(int, int)> except)
        {
            int[] dRow = { -1, 1, 0, 0 };
            int[] dCol = { 0, 0, -1, 1 };

            for (int d = 0; d < 4; d++)
            {
                int newRow = row + dRow[d];
                int newCol = col + dCol[d];

                if (IsValidCell(newRow, newCol) && solution[newRow, newCol] == CellState.Island)
                {
                    bool inExcept = false;
                    foreach (var e in except)
                    {
                        if (e.Item1 == newRow && e.Item2 == newCol)
                        {
                            inExcept = true;
                            break;
                        }
                    }
                    if (!inExcept) return true;
                }
            }
            return false;
        }

        private void ClearAll()
        {
            for (int i = 0; i < gridSize; i++)
            {
                for (int j = 0; j < gridSize; j++)
                {
                    numbers[i, j] = -1;
                    state[i, j] = CellState.Unknown;
                    solution[i, j] = CellState.Unknown;
                }
            }
        }

        private bool ValidateSolutionInternal()
        {
            // 2x2 검은 블록 체크
            for (int i = 0; i < gridSize - 1; i++)
            {
                for (int j = 0; j < gridSize - 1; j++)
                {
                    if (solution[i, j] == CellState.Sea &&
                        solution[i + 1, j] == CellState.Sea &&
                        solution[i, j + 1] == CellState.Sea &&
                        solution[i + 1, j + 1] == CellState.Sea)
                    {
                        return false;
                    }
                }
            }

            // 바다 연결성 체크
            if (!IsSeaConnected(solution))
            {
                return false;
            }

            return true;
        }

        private bool IsSeaConnected(CellState[,] grid)
        {
            // 첫 번째 바다 셀 찾기
            int startRow = -1, startCol = -1;
            int seaCount = 0;

            for (int i = 0; i < gridSize; i++)
            {
                for (int j = 0; j < gridSize; j++)
                {
                    if (grid[i, j] == CellState.Sea)
                    {
                        seaCount++;
                        if (startRow < 0)
                        {
                            startRow = i;
                            startCol = j;
                        }
                    }
                }
            }

            if (seaCount == 0) return true;
            if (startRow < 0) return true;

            // BFS
            bool[,] visited = new bool[gridSize, gridSize];
            Queue<(int, int)> queue = new Queue<(int, int)>();
            queue.Enqueue((startRow, startCol));
            visited[startRow, startCol] = true;
            int connected = 1;

            int[] dRow = { -1, 1, 0, 0 };
            int[] dCol = { 0, 0, -1, 1 };

            while (queue.Count > 0)
            {
                var (row, col) = queue.Dequeue();

                for (int d = 0; d < 4; d++)
                {
                    int newRow = row + dRow[d];
                    int newCol = col + dCol[d];

                    if (IsValidCell(newRow, newCol) && !visited[newRow, newCol] && grid[newRow, newCol] == CellState.Sea)
                    {
                        visited[newRow, newCol] = true;
                        connected++;
                        queue.Enqueue((newRow, newCol));
                    }
                }
            }

            return connected == seaCount;
        }

        private bool IsValidCell(int row, int col)
        {
            return row >= 0 && row < gridSize && col >= 0 && col < gridSize;
        }

        public void SelectCell(int row, int col)
        {
            if (row >= 0 && row < gridSize && col >= 0 && col < gridSize)
            {
                SelectedRow = row;
                SelectedCol = col;
                OnCellSelected?.Invoke(row, col);
            }
        }

        public void CycleState(int row, int col)
        {
            if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return;
            if (numbers[row, col] >= 0) return; // 숫자 셀은 변경 불가

            // Unknown -> Sea -> Island -> Unknown
            state[row, col] = state[row, col] switch
            {
                CellState.Unknown => CellState.Sea,
                CellState.Sea => CellState.Island,
                CellState.Island => CellState.Unknown,
                _ => CellState.Unknown
            };

            OnCellStateChanged?.Invoke(row, col, state[row, col]);
            CheckCompletion();
        }

        public void SetState(int row, int col, CellState newState)
        {
            if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return;
            if (numbers[row, col] >= 0) return;

            state[row, col] = newState;
            OnCellStateChanged?.Invoke(row, col, state[row, col]);
            CheckCompletion();
        }

        public void CycleSelectedCell()
        {
            if (SelectedRow >= 0 && SelectedCol >= 0)
            {
                CycleState(SelectedRow, SelectedCol);
            }
        }

        public override void SetCellValue(int row, int col, int value)
        {
            // value: 0=Unknown, 1=Sea, 2=Island
            state[row, col] = (CellState)value;
            OnCellStateChanged?.Invoke(row, col, state[row, col]);

            base.SetCellValue(row, col, value);
        }

        public override bool ValidateSolution()
        {
            // 1. 모든 셀이 결정되었는지
            for (int i = 0; i < gridSize; i++)
            {
                for (int j = 0; j < gridSize; j++)
                {
                    if (state[i, j] == CellState.Unknown && numbers[i, j] < 0)
                    {
                        return false;
                    }
                }
            }

            // 2. 2x2 바다 블록 없어야 함
            for (int i = 0; i < gridSize - 1; i++)
            {
                for (int j = 0; j < gridSize - 1; j++)
                {
                    if (GetEffectiveState(i, j) == CellState.Sea &&
                        GetEffectiveState(i + 1, j) == CellState.Sea &&
                        GetEffectiveState(i, j + 1) == CellState.Sea &&
                        GetEffectiveState(i + 1, j + 1) == CellState.Sea)
                    {
                        return false;
                    }
                }
            }

            // 3. 바다 연결성
            if (!IsSeaConnected(GetEffectiveGrid()))
            {
                return false;
            }

            // 4. 각 섬 크기 검증
            if (!ValidateIslandSizes())
            {
                return false;
            }

            return true;
        }

        private CellState GetEffectiveState(int row, int col)
        {
            if (numbers[row, col] >= 0) return CellState.Island;
            return state[row, col];
        }

        private CellState[,] GetEffectiveGrid()
        {
            CellState[,] grid = new CellState[gridSize, gridSize];
            for (int i = 0; i < gridSize; i++)
            {
                for (int j = 0; j < gridSize; j++)
                {
                    grid[i, j] = GetEffectiveState(i, j);
                }
            }
            return grid;
        }

        private bool ValidateIslandSizes()
        {
            bool[,] visited = new bool[gridSize, gridSize];
            int[] dRow = { -1, 1, 0, 0 };
            int[] dCol = { 0, 0, -1, 1 };

            for (int i = 0; i < gridSize; i++)
            {
                for (int j = 0; j < gridSize; j++)
                {
                    if (numbers[i, j] >= 0 && !visited[i, j])
                    {
                        // 이 숫자가 속한 섬 크기 측정
                        int expectedSize = numbers[i, j];
                        int actualSize = 0;
                        int numberCount = 0;

                        Queue<(int, int)> queue = new Queue<(int, int)>();
                        queue.Enqueue((i, j));
                        visited[i, j] = true;

                        while (queue.Count > 0)
                        {
                            var (row, col) = queue.Dequeue();
                            actualSize++;
                            if (numbers[row, col] >= 0) numberCount++;

                            for (int d = 0; d < 4; d++)
                            {
                                int newRow = row + dRow[d];
                                int newCol = col + dCol[d];

                                if (IsValidCell(newRow, newCol) && !visited[newRow, newCol] &&
                                    GetEffectiveState(newRow, newCol) == CellState.Island)
                                {
                                    visited[newRow, newCol] = true;
                                    queue.Enqueue((newRow, newCol));
                                }
                            }
                        }

                        // 섬에는 정확히 하나의 숫자, 크기도 일치
                        if (numberCount != 1 || actualSize != expectedSize)
                        {
                            return false;
                        }
                    }
                }
            }

            return true;
        }

        public override void ProvideHint()
        {
            // 틀린 셀 찾아서 수정
            for (int i = 0; i < gridSize; i++)
            {
                for (int j = 0; j < gridSize; j++)
                {
                    if (numbers[i, j] < 0 && state[i, j] != solution[i, j])
                    {
                        state[i, j] = solution[i, j];
                        OnCellStateChanged?.Invoke(i, j, state[i, j]);

                        ScoreManager.Instance?.UseHint();
                        TimerManager.Instance?.ReduceTime(10f);

                        CheckCompletion();
                        return;
                    }
                }
            }
        }

        public override void ResetPuzzle()
        {
            for (int i = 0; i < gridSize; i++)
            {
                for (int j = 0; j < gridSize; j++)
                {
                    if (numbers[i, j] < 0)
                    {
                        state[i, j] = CellState.Unknown;
                        OnCellStateChanged?.Invoke(i, j, CellState.Unknown);
                    }
                }
            }
            IsCompleted = false;
        }

        public int GetGridSize() => gridSize;
        public int GetNumber(int row, int col) => numbers[row, col];
        public CellState GetState(int row, int col) => numbers[row, col] >= 0 ? CellState.Island : state[row, col];
        public int[,] GetNumbers() => (int[,])numbers.Clone();

        /// <summary>
        /// 2x2 바다 블록 오류 체크
        /// </summary>
        public bool Has2x2SeaAt(int row, int col)
        {
            if (GetEffectiveState(row, col) != CellState.Sea) return false;

            // 4방향 2x2 체크
            int[][] offsets = new int[][]
            {
                new int[] { 0, 0, 0, 1, 1, 0, 1, 1 },   // 우하단
                new int[] { 0, -1, 0, 0, 1, -1, 1, 0 }, // 우측
                new int[] { -1, 0, -1, 1, 0, 0, 0, 1 }, // 하단
                new int[] { -1, -1, -1, 0, 0, -1, 0, 0 } // 좌상단
            };

            foreach (var offset in offsets)
            {
                bool all2x2 = true;
                for (int k = 0; k < 8; k += 2)
                {
                    int checkRow = row + offset[k];
                    int checkCol = col + offset[k + 1];
                    if (!IsValidCell(checkRow, checkCol) || GetEffectiveState(checkRow, checkCol) != CellState.Sea)
                    {
                        all2x2 = false;
                        break;
                    }
                }
                if (all2x2) return true;
            }

            return false;
        }
    }
}

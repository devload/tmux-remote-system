using UnityEngine;
using System;
using System.Collections.Generic;
using PuzzleBattle.Core;

namespace PuzzleBattle.Games.Hitori
{
    /// <summary>
    /// Hitori 퍼즐 로직
    /// 규칙:
    /// 1. 각 행과 열에서 같은 숫자가 중복되면 안됨 (검게 칠해서 제거)
    /// 2. 검은 셀은 가로/세로로 인접할 수 없음
    /// 3. 흰 셀들은 모두 연결되어 있어야 함
    /// </summary>
    public class HitoriPuzzle : PuzzleBase
    {
        private int[,] numbers;         // 원래 숫자
        private bool[,] isBlack;        // 검게 칠한 셀
        private bool[,] solution;       // 정답 (true = 검은색)

        public int SelectedRow { get; private set; } = -1;
        public int SelectedCol { get; private set; } = -1;

        // 이벤트
        public event Action<int[,]> OnPuzzleGenerated;
        public event Action<int, int, bool> OnCellStateChanged;
        public event Action<int, int> OnCellSelected;

        private void Awake()
        {
            PuzzleType = PuzzleType.Hitori;
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
            isBlack = new bool[gridSize, gridSize];
            solution = new bool[gridSize, gridSize];

            GeneratePuzzle();

            TimerManager.Instance?.StartTimer(GetTimeLimit());
            ScoreManager.Instance?.ResetScore();

            OnPuzzleGenerated?.Invoke(numbers);
        }

        protected override void GeneratePuzzle()
        {
            // 날짜 기반 시드
            int seed = DateTime.Now.Year * 10000 + DateTime.Now.Month * 100 + DateTime.Now.Day;
            seed += difficulty * 100 + 2; // Hitori용 오프셋
            System.Random random = new System.Random(seed);

            // 1. 유효한 라틴 방진 생성 (각 행/열에 1~n이 한번씩)
            GenerateLatinSquare(random);

            // 2. 일부 셀을 검게 칠할 위치 결정 (정답)
            GenerateBlackCells(random);

            // 3. 검은 셀 위치의 숫자를 중복되게 변경
            AddDuplicates(random);

            Debug.Log($"Hitori puzzle generated: {gridSize}x{gridSize}");
        }

        private void GenerateLatinSquare(System.Random random)
        {
            // 첫 행 생성 (1~n 셔플)
            List<int> firstRow = new List<int>();
            for (int i = 1; i <= gridSize; i++)
                firstRow.Add(i);
            Shuffle(firstRow, random);

            for (int j = 0; j < gridSize; j++)
                numbers[0, j] = firstRow[j];

            // 나머지 행은 시프트
            for (int i = 1; i < gridSize; i++)
            {
                int shift = random.Next(1, gridSize);
                for (int j = 0; j < gridSize; j++)
                {
                    numbers[i, j] = numbers[0, (j + shift * i) % gridSize];
                }
            }
        }

        private void GenerateBlackCells(System.Random random)
        {
            // 검은 셀 개수 (난이도에 따라)
            int blackCount = gridSize * gridSize / 4 + random.Next(gridSize);
            blackCount = Mathf.Clamp(blackCount, gridSize, gridSize * gridSize / 3);

            List<(int, int)> candidates = new List<(int, int)>();
            for (int i = 0; i < gridSize; i++)
                for (int j = 0; j < gridSize; j++)
                    candidates.Add((i, j));

            Shuffle(candidates, random);

            int placed = 0;
            foreach (var (row, col) in candidates)
            {
                if (placed >= blackCount) break;

                // 검은 셀이 인접하면 안됨
                if (HasAdjacentBlack(row, col, solution)) continue;

                // 임시로 검은색으로 설정
                solution[row, col] = true;

                // 흰 셀들이 연결되어 있는지 확인
                if (AreWhiteCellsConnected(solution))
                {
                    placed++;
                }
                else
                {
                    solution[row, col] = false;
                }
            }
        }

        private void AddDuplicates(System.Random random)
        {
            // 검은 셀의 숫자를 같은 행 또는 열의 다른 숫자로 변경
            for (int i = 0; i < gridSize; i++)
            {
                for (int j = 0; j < gridSize; j++)
                {
                    if (solution[i, j])
                    {
                        // 같은 행에서 흰 셀의 숫자 중 하나를 복사
                        List<int> rowNumbers = new List<int>();
                        for (int k = 0; k < gridSize; k++)
                        {
                            if (!solution[i, k] && k != j)
                                rowNumbers.Add(numbers[i, k]);
                        }

                        if (rowNumbers.Count > 0)
                        {
                            numbers[i, j] = rowNumbers[random.Next(rowNumbers.Count)];
                        }
                    }
                }
            }
        }

        private bool HasAdjacentBlack(int row, int col, bool[,] blackGrid)
        {
            int[] dRow = { -1, 1, 0, 0 };
            int[] dCol = { 0, 0, -1, 1 };

            for (int d = 0; d < 4; d++)
            {
                int newRow = row + dRow[d];
                int newCol = col + dCol[d];

                if (IsValidCell(newRow, newCol) && blackGrid[newRow, newCol])
                {
                    return true;
                }
            }
            return false;
        }

        private bool AreWhiteCellsConnected(bool[,] blackGrid)
        {
            // BFS로 흰 셀 연결성 확인
            bool[,] visited = new bool[gridSize, gridSize];
            int whiteCount = 0;
            int connectedCount = 0;

            // 흰 셀 개수 세기
            for (int i = 0; i < gridSize; i++)
                for (int j = 0; j < gridSize; j++)
                    if (!blackGrid[i, j]) whiteCount++;

            // 첫 번째 흰 셀 찾기
            int startRow = -1, startCol = -1;
            for (int i = 0; i < gridSize && startRow < 0; i++)
                for (int j = 0; j < gridSize && startRow < 0; j++)
                    if (!blackGrid[i, j])
                    {
                        startRow = i;
                        startCol = j;
                    }

            if (startRow < 0) return false;

            // BFS
            Queue<(int, int)> queue = new Queue<(int, int)>();
            queue.Enqueue((startRow, startCol));
            visited[startRow, startCol] = true;
            connectedCount = 1;

            int[] dRow = { -1, 1, 0, 0 };
            int[] dCol = { 0, 0, -1, 1 };

            while (queue.Count > 0)
            {
                var (row, col) = queue.Dequeue();

                for (int d = 0; d < 4; d++)
                {
                    int newRow = row + dRow[d];
                    int newCol = col + dCol[d];

                    if (IsValidCell(newRow, newCol) && !visited[newRow, newCol] && !blackGrid[newRow, newCol])
                    {
                        visited[newRow, newCol] = true;
                        connectedCount++;
                        queue.Enqueue((newRow, newCol));
                    }
                }
            }

            return connectedCount == whiteCount;
        }

        private bool IsValidCell(int row, int col)
        {
            return row >= 0 && row < gridSize && col >= 0 && col < gridSize;
        }

        private void Shuffle<T>(List<T> list, System.Random random)
        {
            for (int i = list.Count - 1; i > 0; i--)
            {
                int j = random.Next(i + 1);
                T temp = list[i];
                list[i] = list[j];
                list[j] = temp;
            }
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

        public void ToggleBlack(int row, int col)
        {
            if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return;

            isBlack[row, col] = !isBlack[row, col];
            OnCellStateChanged?.Invoke(row, col, isBlack[row, col]);

            CheckCompletion();
        }

        public void ToggleSelectedCell()
        {
            if (SelectedRow >= 0 && SelectedCol >= 0)
            {
                ToggleBlack(SelectedRow, SelectedCol);
            }
        }

        public override void SetCellValue(int row, int col, int value)
        {
            // Hitori는 value로 검은색 여부 표현 (1 = 검은색, 0 = 흰색)
            isBlack[row, col] = value == 1;
            OnCellStateChanged?.Invoke(row, col, isBlack[row, col]);

            base.SetCellValue(row, col, value);
        }

        public override bool ValidateSolution()
        {
            // 1. 검은 셀이 인접하면 안됨
            for (int i = 0; i < gridSize; i++)
            {
                for (int j = 0; j < gridSize; j++)
                {
                    if (isBlack[i, j] && HasAdjacentBlack(i, j, isBlack))
                    {
                        return false;
                    }
                }
            }

            // 2. 흰 셀들이 연결되어 있어야 함
            if (!AreWhiteCellsConnected(isBlack))
            {
                return false;
            }

            // 3. 각 행/열에 중복 숫자가 없어야 함 (흰 셀만)
            for (int i = 0; i < gridSize; i++)
            {
                HashSet<int> rowNumbers = new HashSet<int>();
                HashSet<int> colNumbers = new HashSet<int>();

                for (int j = 0; j < gridSize; j++)
                {
                    // 행 체크
                    if (!isBlack[i, j])
                    {
                        if (rowNumbers.Contains(numbers[i, j]))
                            return false;
                        rowNumbers.Add(numbers[i, j]);
                    }

                    // 열 체크
                    if (!isBlack[j, i])
                    {
                        if (colNumbers.Contains(numbers[j, i]))
                            return false;
                        colNumbers.Add(numbers[j, i]);
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
                    if (isBlack[i, j] != solution[i, j])
                    {
                        isBlack[i, j] = solution[i, j];
                        OnCellStateChanged?.Invoke(i, j, isBlack[i, j]);

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
                    isBlack[i, j] = false;
                    OnCellStateChanged?.Invoke(i, j, false);
                }
            }
            IsCompleted = false;
        }

        public int GetGridSize() => gridSize;
        public int GetNumber(int row, int col) => numbers[row, col];
        public bool IsBlack(int row, int col) => isBlack[row, col];
        public int[,] GetNumbers() => (int[,])numbers.Clone();
        public bool[,] GetBlackState() => (bool[,])isBlack.Clone();

        /// <summary>
        /// 현재 상태에서 오류 체크
        /// </summary>
        public bool HasErrorAt(int row, int col)
        {
            if (!isBlack[row, col]) return false;

            // 인접한 검은 셀 체크
            return HasAdjacentBlack(row, col, isBlack);
        }

        /// <summary>
        /// 행에 중복 숫자가 있는지 체크
        /// </summary>
        public bool HasDuplicateInRow(int row, int col)
        {
            if (isBlack[row, col]) return false;

            int num = numbers[row, col];
            for (int j = 0; j < gridSize; j++)
            {
                if (j != col && !isBlack[row, j] && numbers[row, j] == num)
                {
                    return true;
                }
            }
            return false;
        }

        /// <summary>
        /// 열에 중복 숫자가 있는지 체크
        /// </summary>
        public bool HasDuplicateInCol(int row, int col)
        {
            if (isBlack[row, col]) return false;

            int num = numbers[row, col];
            for (int i = 0; i < gridSize; i++)
            {
                if (i != row && !isBlack[i, col] && numbers[i, col] == num)
                {
                    return true;
                }
            }
            return false;
        }
    }
}

using UnityEngine;
using System;
using System.Collections.Generic;
using PuzzleBattle.Core;

namespace PuzzleBattle.Games.Streams
{
    /// <summary>
    /// Streams 퍼즐 로직
    /// 1부터 N까지 숫자를 연결하는 경로 퍼즐
    /// </summary>
    public class StreamsPuzzle : PuzzleBase
    {
        private int[,] grid;           // 현재 그리드 상태
        private int[,] solution;       // 정답
        private bool[,] isFixed;       // 고정된 셀 (시작/끝점)
        private int maxNumber;         // 최대 숫자 (경로 길이)

        public int SelectedRow { get; private set; } = -1;
        public int SelectedCol { get; private set; } = -1;

        // 이벤트
        public event Action<int[,], bool[,], int> OnPuzzleGenerated;
        public event Action<int, int, int> OnCellValueChanged;
        public event Action<int, int> OnCellSelected;

        private void Awake()
        {
            PuzzleType = PuzzleType.Streams;
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

            grid = new int[gridSize, gridSize];
            solution = new int[gridSize, gridSize];
            isFixed = new bool[gridSize, gridSize];

            GeneratePuzzle();

            TimerManager.Instance?.StartTimer(GetTimeLimit());
            ScoreManager.Instance?.ResetScore();

            OnPuzzleGenerated?.Invoke(grid, isFixed, maxNumber);
        }

        protected override void GeneratePuzzle()
        {
            // 날짜 기반 시드
            int seed = DateTime.Now.Year * 10000 + DateTime.Now.Month * 100 + DateTime.Now.Day;
            seed += difficulty * 100 + 1; // Streams용 오프셋
            System.Random random = new System.Random(seed);

            // 경로 생성
            GeneratePath(random);

            // 시작점과 끝점만 표시
            for (int i = 0; i < gridSize; i++)
            {
                for (int j = 0; j < gridSize; j++)
                {
                    if (solution[i, j] == 1 || solution[i, j] == maxNumber)
                    {
                        grid[i, j] = solution[i, j];
                        isFixed[i, j] = true;
                    }
                    else
                    {
                        grid[i, j] = 0;
                        isFixed[i, j] = false;
                    }
                }
            }

            Debug.Log($"Streams puzzle generated: {gridSize}x{gridSize}, max={maxNumber}");
        }

        private void GeneratePath(System.Random random)
        {
            // 경로 길이 설정
            maxNumber = gridSize * gridSize / 2 + random.Next(gridSize);
            maxNumber = Mathf.Clamp(maxNumber, gridSize + 2, gridSize * gridSize - gridSize);

            // 시작점 선택
            int startRow = random.Next(gridSize);
            int startCol = random.Next(gridSize);

            List<(int row, int col)> path = new List<(int, int)>();
            path.Add((startRow, startCol));
            solution[startRow, startCol] = 1;

            // 경로 생성 (DFS 방식)
            int currentRow = startRow;
            int currentCol = startCol;
            int[] dRow = { -1, 1, 0, 0 };
            int[] dCol = { 0, 0, -1, 1 };

            for (int num = 2; num <= maxNumber; num++)
            {
                List<(int, int)> validMoves = new List<(int, int)>();

                // 유효한 이동 찾기
                for (int d = 0; d < 4; d++)
                {
                    int newRow = currentRow + dRow[d];
                    int newCol = currentCol + dCol[d];

                    if (IsValidCell(newRow, newCol) && solution[newRow, newCol] == 0)
                    {
                        // 막다른 길 방지 체크
                        if (num < maxNumber - 1 || HasEmptyNeighbor(newRow, newCol, currentRow, currentCol))
                        {
                            validMoves.Add((newRow, newCol));
                        }
                    }
                }

                if (validMoves.Count == 0)
                {
                    // 막혔으면 재시작
                    ClearSolution();
                    GeneratePath(random);
                    return;
                }

                // 랜덤 선택
                var move = validMoves[random.Next(validMoves.Count)];
                currentRow = move.Item1;
                currentCol = move.Item2;
                solution[currentRow, currentCol] = num;
                path.Add((currentRow, currentCol));
            }
        }

        private bool HasEmptyNeighbor(int row, int col, int excludeRow, int excludeCol)
        {
            int[] dRow = { -1, 1, 0, 0 };
            int[] dCol = { 0, 0, -1, 1 };

            for (int d = 0; d < 4; d++)
            {
                int newRow = row + dRow[d];
                int newCol = col + dCol[d];

                if (newRow == excludeRow && newCol == excludeCol) continue;

                if (IsValidCell(newRow, newCol) && solution[newRow, newCol] == 0)
                {
                    return true;
                }
            }
            return false;
        }

        private void ClearSolution()
        {
            for (int i = 0; i < gridSize; i++)
            {
                for (int j = 0; j < gridSize; j++)
                {
                    solution[i, j] = 0;
                }
            }
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

        public void InputNumber(int number)
        {
            if (SelectedRow < 0 || SelectedCol < 0) return;
            if (isFixed[SelectedRow, SelectedCol]) return;
            if (number < 0 || number > maxNumber) return;

            grid[SelectedRow, SelectedCol] = number;
            OnCellValueChanged?.Invoke(SelectedRow, SelectedCol, number);

            CheckCompletion();
        }

        public override void SetCellValue(int row, int col, int value)
        {
            if (isFixed[row, col]) return;

            grid[row, col] = value;
            OnCellValueChanged?.Invoke(row, col, value);

            base.SetCellValue(row, col, value);
        }

        public override bool ValidateSolution()
        {
            // 모든 경로가 연결되어 있는지 확인
            int[] dRow = { -1, 1, 0, 0 };
            int[] dCol = { 0, 0, -1, 1 };

            for (int num = 1; num < maxNumber; num++)
            {
                // num과 num+1이 인접해야 함
                bool found = false;
                for (int i = 0; i < gridSize && !found; i++)
                {
                    for (int j = 0; j < gridSize && !found; j++)
                    {
                        if (grid[i, j] == num)
                        {
                            // 인접한 셀에 num+1이 있는지 확인
                            for (int d = 0; d < 4; d++)
                            {
                                int ni = i + dRow[d];
                                int nj = j + dCol[d];
                                if (IsValidCell(ni, nj) && grid[ni, nj] == num + 1)
                                {
                                    found = true;
                                    break;
                                }
                            }
                        }
                    }
                }

                if (!found) return false;
            }

            return true;
        }

        public override void ProvideHint()
        {
            // 빈 셀 중 하나를 채움
            for (int i = 0; i < gridSize; i++)
            {
                for (int j = 0; j < gridSize; j++)
                {
                    if (grid[i, j] == 0 && solution[i, j] != 0)
                    {
                        grid[i, j] = solution[i, j];
                        isFixed[i, j] = true;
                        OnCellValueChanged?.Invoke(i, j, solution[i, j]);

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
                    if (!isFixed[i, j])
                    {
                        grid[i, j] = 0;
                        OnCellValueChanged?.Invoke(i, j, 0);
                    }
                }
            }
            IsCompleted = false;
        }

        public int GetGridSize() => gridSize;
        public int GetMaxNumber() => maxNumber;
        public int GetCellValue(int row, int col) => grid[row, col];
        public bool IsCellFixed(int row, int col) => isFixed[row, col];
        public int[,] GetCurrentState() => (int[,])grid.Clone();
    }
}

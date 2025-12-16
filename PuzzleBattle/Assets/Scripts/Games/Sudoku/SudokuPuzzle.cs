using UnityEngine;
using System;
using System.Collections.Generic;
using PuzzleBattle.Core;

namespace PuzzleBattle.Games.Sudoku
{
    /// <summary>
    /// 스도쿠 퍼즐 로직
    /// </summary>
    public class SudokuPuzzle : PuzzleBase
    {
        // 9x9 그리드
        private int[,] solution;      // 정답
        private int[,] puzzle;        // 현재 퍼즐 (빈칸 포함)
        private int[,] playerInput;   // 플레이어 입력
        private bool[,] isFixed;      // 고정된 셀 여부

        // 현재 선택된 셀
        public int SelectedRow { get; private set; } = -1;
        public int SelectedCol { get; private set; } = -1;

        // 이벤트
        public event Action<int[,], bool[,]> OnPuzzleGenerated;
        public event Action<int, int, int> OnCellValueChanged;
        public event Action<int, int> OnCellSelected;

        private void Awake()
        {
            PuzzleType = PuzzleType.Sudoku;
            gridSize = 9;
        }

        public override void InitializePuzzle(int diff)
        {
            difficulty = diff;
            IsCompleted = false;

            solution = new int[9, 9];
            puzzle = new int[9, 9];
            playerInput = new int[9, 9];
            isFixed = new bool[9, 9];

            GeneratePuzzle();

            // 타이머 시작
            TimerManager.Instance?.StartTimer(GetTimeLimit());
            ScoreManager.Instance?.ResetScore();

            OnPuzzleGenerated?.Invoke(puzzle, isFixed);
        }

        protected override void GeneratePuzzle()
        {
            // 오늘 날짜 기반 시드
            int seed = DateTime.Now.Year * 10000 + DateTime.Now.Month * 100 + DateTime.Now.Day;
            seed += difficulty * 1000; // 난이도별 다른 퍼즐
            System.Random random = new System.Random(seed);

            // 1. 완전한 스도쿠 생성
            GenerateCompleteSudoku(random);

            // 2. 난이도에 따라 셀 제거
            int cellsToRemove = difficulty switch
            {
                1 => 30, // Easy
                2 => 40, // Medium
                3 => 50, // Hard
                4 => 55, // Expert
                5 => 60, // Master
                _ => 40
            };

            // solution을 puzzle에 복사
            Array.Copy(solution, puzzle, solution.Length);

            // 셀 제거
            RemoveCells(random, cellsToRemove);

            // isFixed 설정
            for (int i = 0; i < 9; i++)
            {
                for (int j = 0; j < 9; j++)
                {
                    isFixed[i, j] = puzzle[i, j] != 0;
                    playerInput[i, j] = puzzle[i, j];
                }
            }

            Debug.Log($"Sudoku generated with difficulty {difficulty}, removed {cellsToRemove} cells");
        }

        private void GenerateCompleteSudoku(System.Random random)
        {
            // 간단한 방식: 기본 패턴 + 셔플
            int[] baseRow = { 1, 2, 3, 4, 5, 6, 7, 8, 9 };
            Shuffle(baseRow, random);

            for (int i = 0; i < 9; i++)
            {
                for (int j = 0; j < 9; j++)
                {
                    int shift = (i / 3) + (i % 3) * 3;
                    solution[i, j] = baseRow[(j + shift) % 9];
                }
            }

            // 행/열/박스 셔플로 다양성 추가
            ShuffleSudoku(random);
        }

        private void Shuffle(int[] array, System.Random random)
        {
            for (int i = array.Length - 1; i > 0; i--)
            {
                int j = random.Next(i + 1);
                (array[i], array[j]) = (array[j], array[i]);
            }
        }

        private void ShuffleSudoku(System.Random random)
        {
            // 같은 밴드 내에서 행 교환
            for (int band = 0; band < 3; band++)
            {
                for (int i = 0; i < 3; i++)
                {
                    int j = random.Next(3);
                    if (i != j)
                    {
                        SwapRows(band * 3 + i, band * 3 + j);
                    }
                }
            }

            // 같은 스택 내에서 열 교환
            for (int stack = 0; stack < 3; stack++)
            {
                for (int i = 0; i < 3; i++)
                {
                    int j = random.Next(3);
                    if (i != j)
                    {
                        SwapCols(stack * 3 + i, stack * 3 + j);
                    }
                }
            }
        }

        private void SwapRows(int r1, int r2)
        {
            for (int j = 0; j < 9; j++)
            {
                (solution[r1, j], solution[r2, j]) = (solution[r2, j], solution[r1, j]);
            }
        }

        private void SwapCols(int c1, int c2)
        {
            for (int i = 0; i < 9; i++)
            {
                (solution[i, c1], solution[i, c2]) = (solution[i, c2], solution[i, c1]);
            }
        }

        private void RemoveCells(System.Random random, int count)
        {
            List<(int, int)> cells = new List<(int, int)>();
            for (int i = 0; i < 9; i++)
            {
                for (int j = 0; j < 9; j++)
                {
                    cells.Add((i, j));
                }
            }

            // 셔플
            for (int i = cells.Count - 1; i > 0; i--)
            {
                int j = random.Next(i + 1);
                (cells[i], cells[j]) = (cells[j], cells[i]);
            }

            // 제거
            for (int i = 0; i < count && i < cells.Count; i++)
            {
                var (row, col) = cells[i];
                puzzle[row, col] = 0;
            }
        }

        /// <summary>
        /// 셀 선택
        /// </summary>
        public void SelectCell(int row, int col)
        {
            if (row >= 0 && row < 9 && col >= 0 && col < 9)
            {
                SelectedRow = row;
                SelectedCol = col;
                OnCellSelected?.Invoke(row, col);
            }
        }

        /// <summary>
        /// 숫자 입력
        /// </summary>
        public void InputNumber(int number)
        {
            if (SelectedRow < 0 || SelectedCol < 0) return;
            if (isFixed[SelectedRow, SelectedCol]) return;
            if (number < 0 || number > 9) return;

            playerInput[SelectedRow, SelectedCol] = number;
            OnCellValueChanged?.Invoke(SelectedRow, SelectedCol, number);

            CheckCompletion();
        }

        public override void SetCellValue(int row, int col, int value)
        {
            if (isFixed[row, col]) return;

            playerInput[row, col] = value;
            OnCellValueChanged?.Invoke(row, col, value);

            base.SetCellValue(row, col, value);
        }

        public override bool ValidateSolution()
        {
            // 모든 셀이 채워졌는지 확인
            for (int i = 0; i < 9; i++)
            {
                for (int j = 0; j < 9; j++)
                {
                    if (playerInput[i, j] == 0) return false;
                    if (playerInput[i, j] != solution[i, j]) return false;
                }
            }
            return true;
        }

        /// <summary>
        /// 현재 상태가 유효한지 검사 (충돌 없는지)
        /// </summary>
        public bool IsCurrentStateValid()
        {
            // 행 검사
            for (int i = 0; i < 9; i++)
            {
                if (!IsGroupValid(GetRow(i))) return false;
            }

            // 열 검사
            for (int j = 0; j < 9; j++)
            {
                if (!IsGroupValid(GetCol(j))) return false;
            }

            // 박스 검사
            for (int box = 0; box < 9; box++)
            {
                if (!IsGroupValid(GetBox(box))) return false;
            }

            return true;
        }

        private int[] GetRow(int row)
        {
            int[] result = new int[9];
            for (int j = 0; j < 9; j++)
            {
                result[j] = playerInput[row, j];
            }
            return result;
        }

        private int[] GetCol(int col)
        {
            int[] result = new int[9];
            for (int i = 0; i < 9; i++)
            {
                result[i] = playerInput[i, col];
            }
            return result;
        }

        private int[] GetBox(int box)
        {
            int[] result = new int[9];
            int startRow = (box / 3) * 3;
            int startCol = (box % 3) * 3;
            int idx = 0;

            for (int i = 0; i < 3; i++)
            {
                for (int j = 0; j < 3; j++)
                {
                    result[idx++] = playerInput[startRow + i, startCol + j];
                }
            }
            return result;
        }

        private bool IsGroupValid(int[] group)
        {
            bool[] seen = new bool[10];
            foreach (int num in group)
            {
                if (num == 0) continue;
                if (seen[num]) return false;
                seen[num] = true;
            }
            return true;
        }

        public override void ProvideHint()
        {
            // 빈 셀 중 하나를 채움
            for (int i = 0; i < 9; i++)
            {
                for (int j = 0; j < 9; j++)
                {
                    if (playerInput[i, j] == 0 || playerInput[i, j] != solution[i, j])
                    {
                        playerInput[i, j] = solution[i, j];
                        isFixed[i, j] = true;
                        OnCellValueChanged?.Invoke(i, j, solution[i, j]);

                        ScoreManager.Instance?.UseHint();

                        // 시간 페널티 (10초)
                        TimerManager.Instance?.ReduceTime(10f);

                        CheckCompletion();
                        return;
                    }
                }
            }
        }

        public override void ResetPuzzle()
        {
            for (int i = 0; i < 9; i++)
            {
                for (int j = 0; j < 9; j++)
                {
                    if (!isFixed[i, j])
                    {
                        playerInput[i, j] = 0;
                        OnCellValueChanged?.Invoke(i, j, 0);
                    }
                }
            }
            IsCompleted = false;
        }

        /// <summary>
        /// 현재 퍼즐 상태 반환
        /// </summary>
        public int[,] GetCurrentState() => (int[,])playerInput.Clone();

        /// <summary>
        /// 셀이 고정인지 확인
        /// </summary>
        public bool IsCellFixed(int row, int col) => isFixed[row, col];

        /// <summary>
        /// 특정 셀의 값 반환
        /// </summary>
        public int GetCellValue(int row, int col) => playerInput[row, col];
    }
}

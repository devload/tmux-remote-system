using UnityEngine;
using PuzzleBattle.Core;
using PuzzleBattle.Games.Sudoku;

namespace PuzzleBattle
{
    /// <summary>
    /// 게임 초기화 및 테스트용 스크립트
    /// </summary>
    public class GameInitializer : MonoBehaviour
    {
        [Header("Test Settings")]
        [SerializeField] private bool autoStartSudoku = true;
        [SerializeField] private int testDifficulty = 1;

        private void Start()
        {
            Debug.Log("=== PuzzleBattle Game Started ===");
            Debug.Log($"Today's puzzles: {string.Join(", ", GameManager.Instance?.TodayPuzzles ?? new System.Collections.Generic.List<PuzzleType>())}");

            if (autoStartSudoku)
            {
                StartSudokuTest();
            }
        }

        public void StartSudokuTest()
        {
            var sudokuObj = FindObjectOfType<SudokuPuzzle>();
            if (sudokuObj != null)
            {
                Debug.Log($"Starting Sudoku with difficulty {testDifficulty}");
                sudokuObj.InitializePuzzle(testDifficulty);
            }
            else
            {
                Debug.LogWarning("SudokuPuzzle not found in scene!");
            }
        }

        [ContextMenu("Test Timer")]
        public void TestTimer()
        {
            TimerManager.Instance?.StartTimer(60f);
            Debug.Log("Timer started for 60 seconds");
        }

        [ContextMenu("Test Score")]
        public void TestScore()
        {
            ScoreManager.Instance?.ResetScore();
            int score = ScoreManager.Instance?.CalculateFinalScore(120f, 2) ?? 0;
            Debug.Log($"Test score calculated: {score}");
        }
    }
}

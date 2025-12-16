using UnityEngine;
using System;
using System.Collections.Generic;

namespace PuzzleBattle.Core
{
    /// <summary>
    /// 전체 게임을 관리하는 싱글톤 매니저
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Header("Game Settings")]
        [SerializeField] private int gamesPerDay = 3;
        [SerializeField] private float defaultTimeLimit = 300f; // 5분

        // 현재 게임 상태
        public GameState CurrentState { get; private set; } = GameState.MainMenu;
        public int TodayGamesPlayed { get; private set; } = 0;
        public int TodayScore { get; private set; } = 0;
        public PuzzleType CurrentPuzzleType { get; private set; } = PuzzleType.Sudoku;

        // 이벤트
        public event Action<GameState> OnGameStateChanged;
        public event Action<int> OnScoreChanged;
        public event Action OnDailyGamesCompleted;

        // 오늘의 게임 목록 (랜덤 선택됨)
        public List<PuzzleType> TodayPuzzles { get; private set; } = new List<PuzzleType>();

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                // DontDestroyOnLoad(gameObject); // 일단 비활성화
                InitializeGame();
                Debug.Log("GameManager initialized");
            }
            else if (Instance != this)
            {
                Debug.Log("Duplicate GameManager destroyed");
                Destroy(gameObject);
            }
        }

        private void InitializeGame()
        {
            // 오늘 날짜 기반 랜덤 시드로 게임 선택
            GenerateDailyPuzzles();
            LoadPlayerProgress();
        }

        /// <summary>
        /// 오늘의 3개 퍼즐을 랜덤 선택
        /// </summary>
        private void GenerateDailyPuzzles()
        {
            TodayPuzzles.Clear();

            // 날짜 기반 시드 (모든 유저가 같은 퍼즐)
            int seed = DateTime.Now.Year * 10000 + DateTime.Now.Month * 100 + DateTime.Now.Day;
            System.Random random = new System.Random(seed);

            var availablePuzzles = new List<PuzzleType>((PuzzleType[])Enum.GetValues(typeof(PuzzleType)));

            for (int i = 0; i < gamesPerDay && availablePuzzles.Count > 0; i++)
            {
                int index = random.Next(availablePuzzles.Count);
                TodayPuzzles.Add(availablePuzzles[index]);
                availablePuzzles.RemoveAt(index);
            }

            Debug.Log($"Today's puzzles: {string.Join(", ", TodayPuzzles)}");
        }

        /// <summary>
        /// 게임 상태 변경
        /// </summary>
        public void SetGameState(GameState newState)
        {
            if (CurrentState != newState)
            {
                CurrentState = newState;
                OnGameStateChanged?.Invoke(newState);
                Debug.Log($"Game state changed to: {newState}");
            }
        }

        /// <summary>
        /// 퍼즐 게임 시작
        /// </summary>
        public void StartPuzzle(PuzzleType puzzleType)
        {
            if (TodayGamesPlayed >= gamesPerDay)
            {
                Debug.LogWarning("Today's games already completed!");
                return;
            }

            CurrentPuzzleType = puzzleType;
            SetGameState(GameState.Playing);
            TimerManager.Instance?.StartTimer(defaultTimeLimit);

            Debug.Log($"Starting puzzle: {puzzleType}");
        }

        /// <summary>
        /// 현재 퍼즐 완료 (점수 자동 계산)
        /// </summary>
        public void CompleteCurrentPuzzle()
        {
            float timeRemaining = TimerManager.Instance?.GetCurrentTime() ?? 0;
            int score = ScoreManager.Instance?.GetCurrentScore() ?? 0;
            CompletePuzzle(score, timeRemaining);
        }

        /// <summary>
        /// 퍼즐 완료
        /// </summary>
        public void CompletePuzzle(int score, float timeRemaining)
        {
            TodayGamesPlayed++;

            // 시간 보너스 점수 계산
            int timeBonus = Mathf.RoundToInt(timeRemaining * 10);
            int totalScore = score + timeBonus;

            TodayScore += totalScore;
            OnScoreChanged?.Invoke(TodayScore);

            SavePlayerProgress();

            if (TodayGamesPlayed >= gamesPerDay)
            {
                OnDailyGamesCompleted?.Invoke();
                SetGameState(GameState.DailyComplete);
            }
            else
            {
                SetGameState(GameState.PuzzleResult);
            }

            Debug.Log($"Puzzle completed! Score: {score}, Time bonus: {timeBonus}, Total: {totalScore}");
        }

        /// <summary>
        /// 퍼즐 실패 (시간 초과)
        /// </summary>
        public void FailPuzzle()
        {
            TodayGamesPlayed++;
            SavePlayerProgress();

            if (TodayGamesPlayed >= gamesPerDay)
            {
                OnDailyGamesCompleted?.Invoke();
                SetGameState(GameState.DailyComplete);
            }
            else
            {
                SetGameState(GameState.PuzzleResult);
            }

            Debug.Log("Puzzle failed - time's up!");
        }

        private void LoadPlayerProgress()
        {
            string today = DateTime.Now.ToString("yyyyMMdd");
            string savedDate = PlayerPrefs.GetString("LastPlayDate", "");

            if (savedDate == today)
            {
                TodayGamesPlayed = PlayerPrefs.GetInt("TodayGamesPlayed", 0);
                TodayScore = PlayerPrefs.GetInt("TodayScore", 0);
            }
            else
            {
                // 새로운 날
                TodayGamesPlayed = 0;
                TodayScore = 0;
            }
        }

        private void SavePlayerProgress()
        {
            string today = DateTime.Now.ToString("yyyyMMdd");
            PlayerPrefs.SetString("LastPlayDate", today);
            PlayerPrefs.SetInt("TodayGamesPlayed", TodayGamesPlayed);
            PlayerPrefs.SetInt("TodayScore", TodayScore);
            PlayerPrefs.Save();
        }

        /// <summary>
        /// 자정에 리셋
        /// </summary>
        public void ResetDailyProgress()
        {
            TodayGamesPlayed = 0;
            TodayScore = 0;
            GenerateDailyPuzzles();
            SavePlayerProgress();
        }
    }

    public enum GameState
    {
        MainMenu,
        PuzzleSelect,
        Playing,
        Paused,
        PuzzleResult,
        DailyComplete,
        Ranking
    }

    public enum PuzzleType
    {
        Sudoku,
        Streams,
        Hitori,
        Nurikabe
    }
}

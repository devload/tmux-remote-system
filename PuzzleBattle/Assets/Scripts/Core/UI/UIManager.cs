using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System;
using PuzzleBattle.Core;

namespace PuzzleBattle.UI
{
    /// <summary>
    /// UI 전체 관리
    /// </summary>
    public class UIManager : MonoBehaviour
    {
        public static UIManager Instance { get; private set; }

        [Header("Panels")]
        [SerializeField] private GameObject mainMenuPanel;
        [SerializeField] private GameObject gamePanel;
        [SerializeField] private GameObject pausePanel;
        [SerializeField] private GameObject resultPanel;
        [SerializeField] private GameObject dailyCompletePanel;

        [Header("Main Menu")]
        [SerializeField] private Button playButton;
        [SerializeField] private TextMeshProUGUI todayGamesText;

        [Header("Game UI")]
        [SerializeField] private TextMeshProUGUI timerText;
        [SerializeField] private TextMeshProUGUI puzzleNameText;
        [SerializeField] private Button pauseButton;
        [SerializeField] private Button hintButton;

        [Header("Result")]
        [SerializeField] private TextMeshProUGUI resultScoreText;
        [SerializeField] private TextMeshProUGUI resultTimeText;
        [SerializeField] private Button nextButton;

        // 이벤트
        public event Action OnPlayClicked;
        public event Action OnPauseClicked;
        public event Action OnResumeClicked;
        public event Action OnHintClicked;
        public event Action OnNextClicked;

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void Start()
        {
            SetupButtons();
            SubscribeToEvents();
            ShowMainMenu();
        }

        private void SetupButtons()
        {
            playButton?.onClick.AddListener(() => OnPlayClicked?.Invoke());
            pauseButton?.onClick.AddListener(() => OnPauseClicked?.Invoke());
            hintButton?.onClick.AddListener(() => OnHintClicked?.Invoke());
            nextButton?.onClick.AddListener(() => OnNextClicked?.Invoke());
        }

        private void SubscribeToEvents()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnGameStateChanged += HandleGameStateChanged;
            }

            if (TimerManager.Instance != null)
            {
                TimerManager.Instance.OnTimeChanged += UpdateTimerDisplay;
                TimerManager.Instance.OnWarningTime += HandleTimeWarning;
            }
        }

        private void OnDestroy()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnGameStateChanged -= HandleGameStateChanged;
            }

            if (TimerManager.Instance != null)
            {
                TimerManager.Instance.OnTimeChanged -= UpdateTimerDisplay;
                TimerManager.Instance.OnWarningTime -= HandleTimeWarning;
            }
        }

        private void HandleGameStateChanged(GameState state)
        {
            HideAllPanels();

            switch (state)
            {
                case GameState.MainMenu:
                    ShowMainMenu();
                    break;
                case GameState.Playing:
                    ShowGameUI();
                    break;
                case GameState.Paused:
                    ShowPauseMenu();
                    break;
                case GameState.PuzzleResult:
                    ShowResult();
                    break;
                case GameState.DailyComplete:
                    ShowDailyComplete();
                    break;
            }
        }

        private void HideAllPanels()
        {
            mainMenuPanel?.SetActive(false);
            gamePanel?.SetActive(false);
            pausePanel?.SetActive(false);
            resultPanel?.SetActive(false);
            dailyCompletePanel?.SetActive(false);
        }

        public void ShowMainMenu()
        {
            HideAllPanels();
            mainMenuPanel?.SetActive(true);

            if (GameManager.Instance != null && todayGamesText != null)
            {
                int played = GameManager.Instance.TodayGamesPlayed;
                int total = GameManager.Instance.TodayPuzzles.Count;
                todayGamesText.text = $"Today: {played}/{total}";
            }
        }

        public void ShowGameUI()
        {
            HideAllPanels();
            gamePanel?.SetActive(true);
        }

        public void ShowPauseMenu()
        {
            pausePanel?.SetActive(true);
        }

        public void ShowResult()
        {
            HideAllPanels();
            resultPanel?.SetActive(true);

            if (ScoreManager.Instance != null && resultScoreText != null)
            {
                resultScoreText.text = $"Score: {ScoreManager.Instance.CurrentScore}";
            }

            if (TimerManager.Instance != null && resultTimeText != null)
            {
                resultTimeText.text = $"Time: {TimerManager.Instance.GetFormattedTime()}";
            }
        }

        public void ShowDailyComplete()
        {
            HideAllPanels();
            dailyCompletePanel?.SetActive(true);
        }

        private void UpdateTimerDisplay(float time)
        {
            if (timerText != null && TimerManager.Instance != null)
            {
                timerText.text = TimerManager.Instance.GetFormattedTime();
            }
        }

        private void HandleTimeWarning(float secondsLeft)
        {
            if (timerText != null)
            {
                if (secondsLeft <= 10f)
                {
                    timerText.color = Color.red;
                }
                else if (secondsLeft <= 30f)
                {
                    timerText.color = new Color(1f, 0.5f, 0f);
                }
            }
        }

        public void SetPuzzleName(string name)
        {
            if (puzzleNameText != null)
            {
                puzzleNameText.text = name;
            }
        }

        public void ResetTimerColor()
        {
            if (timerText != null)
            {
                timerText.color = Color.white;
            }
        }
    }
}

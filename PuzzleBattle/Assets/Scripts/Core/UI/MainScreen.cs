using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections.Generic;
using PuzzleBattle.Core;

namespace PuzzleBattle.UI
{
    /// <summary>
    /// 메인 화면 (홈) - GUI PRO Kit 스타일
    /// </summary>
    public class MainScreen : MonoBehaviour
    {
        [Header("Today's Games")]
        [SerializeField] private Transform gameListContainer;
        [SerializeField] private GameObject gameItemPrefab;
        [SerializeField] private GameObject puzzleCardPrefab; // 새로운 카드 스타일

        [Header("Bottom Tabs")]
        [SerializeField] private Button homeTab;
        [SerializeField] private Button rankingTab;
        [SerializeField] private Button shopTab;
        [SerializeField] private Button settingsTab;

        [Header("Header")]
        [SerializeField] private TextMeshProUGUI welcomeText;
        [SerializeField] private TextMeshProUGUI progressText;
        [SerializeField] private TextMeshProUGUI dateText;

        [Header("Style")]
        [SerializeField] private bool useNewCardStyle = true;

        private List<GameObject> gameItems = new List<GameObject>();

        private void OnEnable()
        {
            RefreshGameList();
            UpdateProgress();
            UpdateDate();
        }

        private void Start()
        {
            SetupTabs();
        }

        private void SetupTabs()
        {
            homeTab?.onClick.AddListener(() => OnTabClicked(0));
            rankingTab?.onClick.AddListener(() => OnTabClicked(1));
            shopTab?.onClick.AddListener(() => OnTabClicked(2));
            settingsTab?.onClick.AddListener(() => OnTabClicked(3));
        }

        private void OnTabClicked(int tabIndex)
        {
            Debug.Log($"Tab clicked: {tabIndex}");
            // TODO: 탭 전환 구현
        }

        public void RefreshGameList()
        {
            // 기존 아이템 제거
            foreach (var item in gameItems)
            {
                Destroy(item);
            }
            gameItems.Clear();

            if (GameManager.Instance == null || gameListContainer == null)
            {
                Debug.LogWarning("GameManager or container not set");
                return;
            }

            // 프리팹 선택 (새 스타일 우선)
            GameObject prefabToUse = useNewCardStyle && puzzleCardPrefab != null
                ? puzzleCardPrefab
                : gameItemPrefab;

            if (prefabToUse == null)
            {
                Debug.LogWarning("No game item prefab set");
                return;
            }

            // 오늘의 게임 목록 생성
            var todayPuzzles = GameManager.Instance.TodayPuzzles;
            int gamesPlayed = GameManager.Instance.TodayGamesPlayed;

            for (int i = 0; i < todayPuzzles.Count; i++)
            {
                var puzzle = todayPuzzles[i];
                bool isCompleted = i < gamesPlayed;
                bool isLocked = i > gamesPlayed; // 순서대로 플레이

                CreateGameItem(puzzle, i, isCompleted, isLocked, prefabToUse);
            }
        }

        private void CreateGameItem(PuzzleType puzzleType, int index, bool isCompleted, bool isLocked, GameObject prefab)
        {
            var itemObj = Instantiate(prefab, gameListContainer);
            gameItems.Add(itemObj);

            // 새로운 PuzzleCardUI 스타일
            var cardUI = itemObj.GetComponent<PuzzleCardUI>();
            if (cardUI != null)
            {
                cardUI.Setup(puzzleType, index, isCompleted, isLocked);
                cardUI.OnCardClicked += OnGameSelected;
                return;
            }

            // 기존 GameItemUI 스타일 (폴백)
            var itemUI = itemObj.GetComponent<GameItemUI>();
            if (itemUI != null)
            {
                itemUI.Setup(puzzleType, index, isCompleted, isLocked);
                itemUI.OnGameSelected += OnGameSelected;
            }
        }

        private void OnGameSelected(PuzzleType puzzleType, int index)
        {
            Debug.Log($"Game selected: {puzzleType} (index: {index})");

            // 게임 시작
            GameManager.Instance?.StartPuzzle(puzzleType);
            ScreenManager.Instance?.GoToGame();
        }

        private void UpdateProgress()
        {
            if (GameManager.Instance != null && progressText != null)
            {
                int played = GameManager.Instance.TodayGamesPlayed;
                int total = GameManager.Instance.TodayPuzzles.Count;

                if (played == total)
                {
                    progressText.text = "All Complete! 🎉";
                    progressText.color = new Color(0.4f, 0.9f, 0.5f);
                }
                else
                {
                    progressText.text = $"{played}/{total} Completed";
                    progressText.color = Color.white;
                }
            }
        }

        private void UpdateDate()
        {
            if (dateText != null)
            {
                dateText.text = System.DateTime.Now.ToString("dddd, MMM d");
            }
        }
    }
}

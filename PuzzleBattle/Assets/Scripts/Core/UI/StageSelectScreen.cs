using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections.Generic;
using PuzzleBattle.Core;

namespace PuzzleBattle.UI
{
    /// <summary>
    /// Stage Select 스타일의 메인 화면
    /// GUI PRO Kit의 Stage_Select_Type1 프리팹 사용
    /// </summary>
    public class StageSelectScreen : MonoBehaviour
    {
        [Header("Stage Cards")]
        [SerializeField] private List<GameObject> stageCards = new List<GameObject>();

        [Header("Navigation")]
        [SerializeField] private Button backButton;
        [SerializeField] private Button leftArrow;
        [SerializeField] private Button rightArrow;

        [Header("Header")]
        [SerializeField] private TextMeshProUGUI screenTitleText;
        [SerializeField] private TextMeshProUGUI progressText;

        // 퍼즐 타입과 스테이지 카드 매핑
        private Dictionary<int, PuzzleType> cardToPuzzle = new Dictionary<int, PuzzleType>();

        private void OnEnable()
        {
            SetupStageCards();
            UpdateProgress();
        }

        private void Start()
        {
            SetupNavigation();
        }

        private void SetupNavigation()
        {
            if (backButton != null)
            {
                backButton.onClick.AddListener(() =>
                {
                    ScreenManager.Instance?.GoToLogin();
                });
            }
        }

        private void SetupStageCards()
        {
            if (GameManager.Instance == null) return;

            var todayPuzzles = GameManager.Instance.TodayPuzzles;
            int gamesPlayed = GameManager.Instance.TodayGamesPlayed;

            // 카드와 퍼즐 매핑
            cardToPuzzle.Clear();

            for (int i = 0; i < stageCards.Count; i++)
            {
                var card = stageCards[i];
                if (card == null) continue;

                // 퍼즐 타입 결정 (오늘의 퍼즐 또는 순환)
                PuzzleType puzzleType;
                if (i < todayPuzzles.Count)
                {
                    puzzleType = todayPuzzles[i];
                }
                else
                {
                    // 오늘의 퍼즐 외의 카드는 순환
                    puzzleType = (PuzzleType)(i % System.Enum.GetValues(typeof(PuzzleType)).Length);
                }

                cardToPuzzle[i] = puzzleType;

                // 카드 상태 설정
                bool isCompleted = i < gamesPlayed;
                bool isLocked = i > gamesPlayed;
                bool isCurrent = i == gamesPlayed;

                SetupCard(card, i, puzzleType, isCompleted, isLocked, isCurrent);
            }
        }

        private void SetupCard(GameObject card, int index, PuzzleType puzzleType, bool isCompleted, bool isLocked, bool isCurrent)
        {
            var style = GetPuzzleStyle(puzzleType);

            // 카드 내 텍스트 업데이트
            var texts = card.GetComponentsInChildren<TextMeshProUGUI>(true);
            foreach (var text in texts)
            {
                string name = text.name.ToLower();

                // 카드 제목에 해당하는 텍스트 찾기
                if (name.Contains("title") || name.Contains("name") || name.Contains("text"))
                {
                    if (text.fontSize >= 20 || name.Contains("title"))
                    {
                        text.text = style.displayName;
                    }
                }

                // 잠금/완료 레이블이 있으면 업데이트
                if (name.Contains("lock") || name.Contains("require"))
                {
                    text.gameObject.SetActive(isLocked);
                    if (isLocked)
                    {
                        text.text = "Complete previous first";
                    }
                }
            }

            // 버튼 설정
            var button = card.GetComponent<Button>();
            if (button != null)
            {
                button.onClick.RemoveAllListeners();
                button.interactable = !isLocked;

                int cardIndex = index;
                button.onClick.AddListener(() => OnCardClicked(cardIndex));
            }

            // 잠금 아이콘 찾아서 활성화/비활성화
            var images = card.GetComponentsInChildren<Image>(true);
            foreach (var img in images)
            {
                string name = img.name.ToLower();
                if (name.Contains("lock"))
                {
                    img.gameObject.SetActive(isLocked);
                }
                else if (name.Contains("check") || name.Contains("complete") || name.Contains("clear"))
                {
                    img.gameObject.SetActive(isCompleted);
                }
                else if (name.Contains("new") || name.Contains("current"))
                {
                    img.gameObject.SetActive(isCurrent);
                }
            }

            // 카드 색상/투명도 조정
            var cardImage = card.GetComponent<Image>();
            if (cardImage != null)
            {
                var color = cardImage.color;
                color.a = isLocked ? 0.5f : 1f;
                cardImage.color = color;
            }
        }

        private void OnCardClicked(int cardIndex)
        {
            if (!cardToPuzzle.ContainsKey(cardIndex)) return;

            var puzzleType = cardToPuzzle[cardIndex];

            Debug.Log($"Stage card clicked: {cardIndex} -> {puzzleType}");

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

                if (played >= total)
                {
                    progressText.text = "All Complete!";
                    progressText.color = new Color(0.4f, 0.9f, 0.5f);
                }
                else
                {
                    progressText.text = $"{played}/{total}";
                    progressText.color = Color.white;
                }
            }

            if (screenTitleText != null)
            {
                screenTitleText.text = "Today's Puzzles";
            }
        }

        private PuzzleStyle GetPuzzleStyle(PuzzleType type)
        {
            return type switch
            {
                PuzzleType.Sudoku => new PuzzleStyle
                {
                    displayName = "Number Master",
                    description = "Fill 1-9 in the grid"
                },
                PuzzleType.Streams => new PuzzleStyle
                {
                    displayName = "Flow Connect",
                    description = "Link numbers together"
                },
                PuzzleType.Hitori => new PuzzleStyle
                {
                    displayName = "Shadow Puzzle",
                    description = "Find hidden shadows"
                },
                PuzzleType.Nurikabe => new PuzzleStyle
                {
                    displayName = "Island Builder",
                    description = "Create island kingdoms"
                },
                _ => new PuzzleStyle
                {
                    displayName = type.ToString(),
                    description = "Solve the puzzle!"
                }
            };
        }

        private struct PuzzleStyle
        {
            public string displayName;
            public string description;
        }
    }
}

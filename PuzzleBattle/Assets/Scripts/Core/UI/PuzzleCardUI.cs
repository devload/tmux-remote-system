using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System;
using PuzzleBattle.Core;

namespace PuzzleBattle.UI
{
    /// <summary>
    /// GUI PRO Kit 스타일의 퍼즐 카드 UI
    /// Stage_Select 스타일의 화려한 카드 디자인
    /// </summary>
    public class PuzzleCardUI : MonoBehaviour
    {
        [Header("Card Elements")]
        [SerializeField] private Image cardBackground;
        [SerializeField] private Image cardFrame;
        [SerializeField] private Image iconBackground;
        [SerializeField] private TextMeshProUGUI iconText;
        [SerializeField] private TextMeshProUGUI titleText;
        [SerializeField] private TextMeshProUGUI subtitleText;
        [SerializeField] private TextMeshProUGUI difficultyText;

        [Header("Status Elements")]
        [SerializeField] private GameObject starContainer;
        [SerializeField] private Image[] stars;
        [SerializeField] private GameObject completedBadge;
        [SerializeField] private GameObject lockedOverlay;
        [SerializeField] private Image lockIcon;
        [SerializeField] private GameObject newBadge;

        [Header("Play Button")]
        [SerializeField] private Button playButton;
        [SerializeField] private Image playButtonBg;
        [SerializeField] private TextMeshProUGUI playButtonText;

        [Header("Progress")]
        [SerializeField] private Slider progressSlider;
        [SerializeField] private TextMeshProUGUI progressText;

        public event Action<PuzzleType, int> OnCardClicked;

        private PuzzleType puzzleType;
        private int cardIndex;
        private bool isCompleted;
        private bool isLocked;
        private int earnedStars;

        public void Setup(PuzzleType type, int index, bool completed, bool locked, int stars = 0)
        {
            puzzleType = type;
            cardIndex = index;
            isCompleted = completed;
            isLocked = locked;
            earnedStars = stars;

            var style = GetPuzzleCardStyle(type);
            ApplyStyle(style);
            UpdateState();

            if (playButton != null)
            {
                playButton.onClick.RemoveAllListeners();
                playButton.onClick.AddListener(OnPlayButtonClicked);
            }
        }

        private void ApplyStyle(PuzzleCardStyle style)
        {
            // 카드 배경 그라데이션 효과
            if (cardBackground != null)
            {
                cardBackground.color = style.cardColor;
            }

            // 아이콘 배경
            if (iconBackground != null)
            {
                iconBackground.color = style.iconBgColor;
            }

            // 아이콘 텍스트
            if (iconText != null)
            {
                iconText.text = style.icon;
                iconText.color = Color.white;
            }

            // 제목
            if (titleText != null)
            {
                titleText.text = style.title;
                titleText.color = style.titleColor;
            }

            // 부제목 (설명)
            if (subtitleText != null)
            {
                subtitleText.text = style.subtitle;
                subtitleText.color = style.subtitleColor;
            }

            // 난이도 표시
            if (difficultyText != null)
            {
                difficultyText.text = style.difficulty;
                difficultyText.color = style.difficultyColor;
            }

            // 플레이 버튼 색상
            if (playButtonBg != null)
            {
                playButtonBg.color = style.buttonColor;
            }

            if (playButtonText != null)
            {
                playButtonText.text = "PLAY";
                playButtonText.color = Color.white;
            }
        }

        private void UpdateState()
        {
            // 완료 상태
            if (completedBadge != null)
            {
                completedBadge.SetActive(isCompleted);
            }

            // 잠금 상태
            if (lockedOverlay != null)
            {
                lockedOverlay.SetActive(isLocked);
            }

            // NEW 뱃지 (첫 번째 플레이 가능한 게임)
            if (newBadge != null)
            {
                newBadge.SetActive(!isCompleted && !isLocked && cardIndex == GameManager.Instance?.TodayGamesPlayed);
            }

            // 별 표시
            UpdateStars();

            // 버튼 상태
            if (playButton != null)
            {
                playButton.interactable = !isCompleted && !isLocked;
            }

            if (playButtonText != null)
            {
                if (isCompleted)
                    playButtonText.text = "DONE";
                else if (isLocked)
                    playButtonText.text = "LOCKED";
                else
                    playButtonText.text = "PLAY!";
            }

            // 카드 투명도 조정
            if (cardBackground != null)
            {
                var color = cardBackground.color;
                color.a = isLocked ? 0.5f : 1f;
                cardBackground.color = color;
            }
        }

        private void UpdateStars()
        {
            if (stars == null || stars.Length == 0) return;

            for (int i = 0; i < stars.Length; i++)
            {
                if (stars[i] != null)
                {
                    // 획득한 별은 노란색, 아닌 것은 회색
                    stars[i].color = i < earnedStars
                        ? new Color(1f, 0.85f, 0.2f)
                        : new Color(0.4f, 0.4f, 0.45f);
                }
            }
        }

        private void OnPlayButtonClicked()
        {
            if (!isCompleted && !isLocked)
            {
                OnCardClicked?.Invoke(puzzleType, cardIndex);
            }
        }

        private PuzzleCardStyle GetPuzzleCardStyle(PuzzleType type)
        {
            return type switch
            {
                PuzzleType.Sudoku => new PuzzleCardStyle
                {
                    title = "Number Master",
                    subtitle = "Fill 1-9 in the grid",
                    icon = "9",
                    difficulty = "★★☆",
                    cardColor = new Color(0.3f, 0.6f, 0.95f),
                    iconBgColor = new Color(0.2f, 0.45f, 0.8f),
                    titleColor = Color.white,
                    subtitleColor = new Color(0.85f, 0.9f, 1f),
                    difficultyColor = new Color(1f, 0.9f, 0.4f),
                    buttonColor = new Color(0.25f, 0.75f, 0.45f)
                },
                PuzzleType.Streams => new PuzzleCardStyle
                {
                    title = "Flow Connect",
                    subtitle = "Link numbers together",
                    icon = "∿",
                    difficulty = "★☆☆",
                    cardColor = new Color(0.35f, 0.85f, 0.65f),
                    iconBgColor = new Color(0.25f, 0.7f, 0.5f),
                    titleColor = Color.white,
                    subtitleColor = new Color(0.85f, 1f, 0.9f),
                    difficultyColor = new Color(1f, 0.9f, 0.4f),
                    buttonColor = new Color(0.9f, 0.55f, 0.3f)
                },
                PuzzleType.Hitori => new PuzzleCardStyle
                {
                    title = "Shadow Puzzle",
                    subtitle = "Find hidden shadows",
                    icon = "◼",
                    difficulty = "★★★",
                    cardColor = new Color(0.65f, 0.45f, 0.9f),
                    iconBgColor = new Color(0.5f, 0.35f, 0.75f),
                    titleColor = Color.white,
                    subtitleColor = new Color(0.9f, 0.85f, 1f),
                    difficultyColor = new Color(1f, 0.9f, 0.4f),
                    buttonColor = new Color(0.95f, 0.45f, 0.55f)
                },
                PuzzleType.Nurikabe => new PuzzleCardStyle
                {
                    title = "Island Builder",
                    subtitle = "Create island kingdoms",
                    icon = "◇",
                    difficulty = "★★☆",
                    cardColor = new Color(0.95f, 0.6f, 0.35f),
                    iconBgColor = new Color(0.85f, 0.45f, 0.25f),
                    titleColor = Color.white,
                    subtitleColor = new Color(1f, 0.9f, 0.85f),
                    difficultyColor = new Color(1f, 0.9f, 0.4f),
                    buttonColor = new Color(0.3f, 0.7f, 0.9f)
                },
                _ => new PuzzleCardStyle
                {
                    title = type.ToString(),
                    subtitle = "Solve the puzzle!",
                    icon = "★",
                    difficulty = "★☆☆",
                    cardColor = new Color(0.5f, 0.55f, 0.65f),
                    iconBgColor = new Color(0.4f, 0.45f, 0.55f),
                    titleColor = Color.white,
                    subtitleColor = new Color(0.9f, 0.9f, 0.95f),
                    difficultyColor = new Color(1f, 0.9f, 0.4f),
                    buttonColor = new Color(0.5f, 0.7f, 0.5f)
                }
            };
        }

        private struct PuzzleCardStyle
        {
            public string title;
            public string subtitle;
            public string icon;
            public string difficulty;
            public Color cardColor;
            public Color iconBgColor;
            public Color titleColor;
            public Color subtitleColor;
            public Color difficultyColor;
            public Color buttonColor;
        }
    }
}

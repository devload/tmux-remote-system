using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System;
using PuzzleBattle.Core;

namespace PuzzleBattle.UI
{
    /// <summary>
    /// 게임 목록 아이템 UI
    /// </summary>
    public class GameItemUI : MonoBehaviour
    {
        [Header("UI Elements")]
        [SerializeField] private Image backgroundImage;
        [SerializeField] private Image iconImage;
        [SerializeField] private TextMeshProUGUI gameNameText;
        [SerializeField] private TextMeshProUGUI statusText;
        [SerializeField] private Button playButton;
        [SerializeField] private GameObject completedCheck;
        [SerializeField] private GameObject lockIcon;
        [SerializeField] private Image colorBar;
        [SerializeField] private TextMeshProUGUI iconText;

        [Header("Colors")]
        [SerializeField] private Color normalBgColor = new Color(0.14f, 0.18f, 0.28f);
        [SerializeField] private Color completedBgColor = new Color(0.12f, 0.22f, 0.18f);
        [SerializeField] private Color lockedBgColor = new Color(0.15f, 0.15f, 0.18f);

        public event Action<PuzzleType, int> OnGameSelected;

        private PuzzleType puzzleType;
        private int index;
        private bool isCompleted;
        private bool isLocked;

        public void Setup(PuzzleType type, int idx, bool completed, bool locked)
        {
            puzzleType = type;
            index = idx;
            isCompleted = completed;
            isLocked = locked;

            // 게임별 스타일 설정
            var style = GetPuzzleStyle(type);

            // 게임 이름 설정
            if (gameNameText != null)
            {
                gameNameText.text = style.displayName;
            }

            // 아이콘 설정
            if (iconText != null)
            {
                iconText.text = style.icon;
            }

            // 색상바 설정
            if (colorBar != null)
            {
                colorBar.color = isCompleted ? new Color(0.3f, 0.7f, 0.4f) :
                                 isLocked ? new Color(0.4f, 0.4f, 0.45f) :
                                 style.accentColor;
            }

            // 아이콘 배경색
            if (iconImage != null)
            {
                iconImage.color = isCompleted ? new Color(0.25f, 0.5f, 0.35f) :
                                  isLocked ? new Color(0.3f, 0.3f, 0.35f) :
                                  style.iconBgColor;
            }

            // 상태 표시
            UpdateStatus();

            // 버튼 설정
            if (playButton != null)
            {
                playButton.interactable = !isCompleted && !isLocked;
                playButton.onClick.RemoveAllListeners();
                playButton.onClick.AddListener(OnPlayClicked);

                // 플레이 버튼 색상
                var playBtnImage = playButton.GetComponent<Image>();
                if (playBtnImage != null)
                {
                    playBtnImage.color = isCompleted ? new Color(0.3f, 0.6f, 0.4f) :
                                         isLocked ? new Color(0.35f, 0.35f, 0.4f) :
                                         new Color(0.25f, 0.7f, 0.4f);
                }
            }

            // 배경색
            if (backgroundImage != null)
            {
                if (isCompleted)
                    backgroundImage.color = completedBgColor;
                else if (isLocked)
                    backgroundImage.color = lockedBgColor;
                else
                    backgroundImage.color = normalBgColor;
            }

            // 체크/잠금 아이콘 표시
            if (completedCheck != null)
                completedCheck.SetActive(isCompleted);
            if (lockIcon != null)
                lockIcon.SetActive(isLocked);
        }

        private PuzzleStyle GetPuzzleStyle(PuzzleType type)
        {
            // GUI PRO Kit - Casual Game 스타일에 맞춘 밝고 친근한 테마
            return type switch
            {
                PuzzleType.Sudoku => new PuzzleStyle
                {
                    displayName = "Number Master",
                    description = "Fill the grid with 1-9!",
                    icon = "9",
                    accentColor = new Color(0.35f, 0.75f, 0.95f),   // 밝은 하늘색
                    iconBgColor = new Color(0.25f, 0.55f, 0.85f),
                    gradientStart = new Color(0.4f, 0.8f, 1f),
                    gradientEnd = new Color(0.2f, 0.5f, 0.9f)
                },
                PuzzleType.Streams => new PuzzleStyle
                {
                    displayName = "Flow Connect",
                    description = "Link the numbers!",
                    icon = "~",
                    accentColor = new Color(0.4f, 0.9f, 0.7f),      // 민트 그린
                    iconBgColor = new Color(0.3f, 0.75f, 0.55f),
                    gradientStart = new Color(0.5f, 0.95f, 0.75f),
                    gradientEnd = new Color(0.25f, 0.7f, 0.5f)
                },
                PuzzleType.Hitori => new PuzzleStyle
                {
                    displayName = "Shadow Puzzle",
                    description = "Find the shadows!",
                    icon = "■",
                    accentColor = new Color(0.75f, 0.55f, 0.95f),   // 라벤더
                    iconBgColor = new Color(0.6f, 0.4f, 0.8f),
                    gradientStart = new Color(0.85f, 0.65f, 1f),
                    gradientEnd = new Color(0.55f, 0.35f, 0.75f)
                },
                PuzzleType.Nurikabe => new PuzzleStyle
                {
                    displayName = "Island Builder",
                    description = "Create islands!",
                    icon = "◆",
                    accentColor = new Color(1f, 0.7f, 0.4f),        // 오렌지
                    iconBgColor = new Color(0.9f, 0.55f, 0.3f),
                    gradientStart = new Color(1f, 0.8f, 0.5f),
                    gradientEnd = new Color(0.85f, 0.5f, 0.25f)
                },
                _ => new PuzzleStyle
                {
                    displayName = type.ToString(),
                    description = "Solve the puzzle!",
                    icon = "★",
                    accentColor = new Color(0.6f, 0.6f, 0.7f),
                    iconBgColor = new Color(0.5f, 0.5f, 0.6f),
                    gradientStart = new Color(0.7f, 0.7f, 0.8f),
                    gradientEnd = new Color(0.5f, 0.5f, 0.6f)
                }
            };
        }

        private void UpdateStatus()
        {
            if (statusText == null) return;

            if (isCompleted)
            {
                statusText.text = "Completed!";
                statusText.color = new Color(0.4f, 0.8f, 0.5f);
            }
            else if (isLocked)
            {
                statusText.text = "Complete previous first";
                statusText.color = new Color(0.5f, 0.5f, 0.55f);
            }
            else
            {
                statusText.text = "Tap to Play!";
                statusText.color = new Color(0.5f, 0.8f, 0.55f);
            }
        }

        private void OnPlayClicked()
        {
            if (!isCompleted && !isLocked)
            {
                OnGameSelected?.Invoke(puzzleType, index);
            }
        }

        private struct PuzzleStyle
        {
            public string displayName;
            public string description;
            public string icon;
            public Color accentColor;
            public Color iconBgColor;
            public Color gradientStart;
            public Color gradientEnd;
        }
    }
}

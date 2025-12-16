using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System;

namespace PuzzleBattle.Games.Hitori
{
    /// <summary>
    /// Hitori 퍼즐 UI
    /// 셀을 터치하면 검게 칠하기/해제 토글
    /// </summary>
    public class HitoriUI : MonoBehaviour
    {
        [Header("Grid")]
        [SerializeField] private Transform gridContainer;
        [SerializeField] private GameObject cellPrefab;

        [Header("Colors")]
        [SerializeField] private Color normalColor = Color.white;
        [SerializeField] private Color blackColor = new Color(0.2f, 0.2f, 0.2f);
        [SerializeField] private Color selectedColor = new Color(0.7f, 0.85f, 1f);
        [SerializeField] private Color errorColor = new Color(0.8f, 0.2f, 0.2f);
        [SerializeField] private Color duplicateColor = new Color(1f, 0.9f, 0.7f);

        private HitoriPuzzle puzzle;
        private HitoriCellUI[,] cells;
        private int gridSize;

        public void Initialize(HitoriPuzzle hitoriPuzzle)
        {
            puzzle = hitoriPuzzle;

            puzzle.OnPuzzleGenerated -= OnPuzzleGenerated;
            puzzle.OnPuzzleGenerated += OnPuzzleGenerated;
            puzzle.OnCellStateChanged -= OnCellStateChanged;
            puzzle.OnCellStateChanged += OnCellStateChanged;
            puzzle.OnCellSelected -= OnCellSelected;
            puzzle.OnCellSelected += OnCellSelected;
        }

        private void OnDestroy()
        {
            if (puzzle != null)
            {
                puzzle.OnPuzzleGenerated -= OnPuzzleGenerated;
                puzzle.OnCellStateChanged -= OnCellStateChanged;
                puzzle.OnCellSelected -= OnCellSelected;
            }
        }

        private void OnPuzzleGenerated(int[,] numbers)
        {
            gridSize = puzzle.GetGridSize();
            CreateGrid(numbers);
        }

        private void CreateGrid(int[,] numbers)
        {
            if (gridContainer == null || cellPrefab == null) return;

            // 기존 셀 제거
            foreach (Transform child in gridContainer)
            {
                Destroy(child.gameObject);
            }

            cells = new HitoriCellUI[gridSize, gridSize];

            // GridLayoutGroup 설정
            var gridLayout = gridContainer.GetComponent<GridLayoutGroup>();
            if (gridLayout != null)
            {
                float containerWidth = ((RectTransform)gridContainer).rect.width;
                float cellSize = (containerWidth - (gridSize - 1) * gridLayout.spacing.x) / gridSize;
                gridLayout.cellSize = new Vector2(cellSize, cellSize);
                gridLayout.constraint = GridLayoutGroup.Constraint.FixedColumnCount;
                gridLayout.constraintCount = gridSize;
            }

            // 그리드 생성
            for (int i = 0; i < gridSize; i++)
            {
                for (int j = 0; j < gridSize; j++)
                {
                    var cellObj = Instantiate(cellPrefab, gridContainer);
                    cellObj.name = $"Cell_{i}_{j}";

                    var cellUI = cellObj.GetComponent<HitoriCellUI>();
                    if (cellUI == null)
                    {
                        cellUI = cellObj.AddComponent<HitoriCellUI>();
                    }

                    int row = i;
                    int col = j;
                    cellUI.Initialize(row, col, numbers[i, j]);
                    cellUI.OnCellClicked += () => OnCellClicked(row, col);

                    cells[i, j] = cellUI;
                }
            }

            UpdateAllCellColors();
            Debug.Log($"Hitori grid created: {gridSize}x{gridSize}");
        }

        private void OnCellClicked(int row, int col)
        {
            // 셀 선택 및 토글
            puzzle?.SelectCell(row, col);
            puzzle?.ToggleBlack(row, col);
        }

        private void OnCellSelected(int row, int col)
        {
            UpdateAllCellColors();
            if (cells[row, col] != null && !puzzle.IsBlack(row, col))
            {
                cells[row, col].SetBackgroundColor(selectedColor);
            }
        }

        private void OnCellStateChanged(int row, int col, bool isBlack)
        {
            if (cells == null || cells[row, col] == null) return;

            cells[row, col].SetBlack(isBlack);
            UpdateAllCellColors();
        }

        private void UpdateAllCellColors()
        {
            if (cells == null || puzzle == null) return;

            for (int i = 0; i < gridSize; i++)
            {
                for (int j = 0; j < gridSize; j++)
                {
                    if (cells[i, j] == null) continue;

                    bool isBlack = puzzle.IsBlack(i, j);

                    if (isBlack)
                    {
                        // 검은 셀이 인접해 있으면 오류
                        if (puzzle.HasErrorAt(i, j))
                        {
                            cells[i, j].SetBackgroundColor(errorColor);
                        }
                        else
                        {
                            cells[i, j].SetBackgroundColor(blackColor);
                        }
                    }
                    else
                    {
                        // 흰 셀인데 중복이 있으면 하이라이트
                        if (puzzle.HasDuplicateInRow(i, j) || puzzle.HasDuplicateInCol(i, j))
                        {
                            cells[i, j].SetBackgroundColor(duplicateColor);
                        }
                        else
                        {
                            cells[i, j].SetBackgroundColor(normalColor);
                        }
                    }
                }
            }
        }
    }

    /// <summary>
    /// Hitori 셀 UI
    /// </summary>
    public class HitoriCellUI : MonoBehaviour
    {
        public int Row { get; private set; }
        public int Col { get; private set; }
        public int Number { get; private set; }
        public bool IsBlack { get; private set; }

        public event Action OnCellClicked;

        private Image background;
        private TextMeshProUGUI numberText;
        private Button button;

        public void Initialize(int row, int col, int number)
        {
            Row = row;
            Col = col;
            Number = number;
            IsBlack = false;

            background = GetComponent<Image>();
            numberText = GetComponentInChildren<TextMeshProUGUI>();
            button = GetComponent<Button>();

            if (numberText != null)
            {
                numberText.text = number.ToString();
                numberText.color = Color.black;
            }

            button?.onClick.AddListener(() => OnCellClicked?.Invoke());
        }

        public void SetBlack(bool black)
        {
            IsBlack = black;
            if (numberText != null)
            {
                // 검은 셀은 숫자를 흰색으로 (또는 숨기기)
                numberText.color = black ? Color.white : Color.black;
            }
        }

        public void SetBackgroundColor(Color color)
        {
            if (background != null)
            {
                background.color = color;
            }
        }
    }
}

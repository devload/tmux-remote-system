using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System;

namespace PuzzleBattle.Games.Nurikabe
{
    /// <summary>
    /// Nurikabe 퍼즐 UI
    /// 셀을 터치하면 Unknown -> Sea -> Island -> Unknown 순환
    /// </summary>
    public class NurikabeUI : MonoBehaviour
    {
        [Header("Grid")]
        [SerializeField] private Transform gridContainer;
        [SerializeField] private GameObject cellPrefab;

        [Header("Colors")]
        [SerializeField] private Color unknownColor = new Color(0.9f, 0.9f, 0.9f);
        [SerializeField] private Color seaColor = new Color(0.2f, 0.3f, 0.5f);
        [SerializeField] private Color islandColor = Color.white;
        [SerializeField] private Color numberColor = new Color(0.95f, 0.95f, 0.85f);
        [SerializeField] private Color selectedColor = new Color(0.7f, 0.85f, 1f);
        [SerializeField] private Color errorColor = new Color(0.8f, 0.2f, 0.2f);

        private NurikabePuzzle puzzle;
        private NurikabeCellUI[,] cells;
        private int gridSize;

        public void Initialize(NurikabePuzzle nurikabePuzzle)
        {
            puzzle = nurikabePuzzle;

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

            cells = new NurikabeCellUI[gridSize, gridSize];

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

                    var cellUI = cellObj.GetComponent<NurikabeCellUI>();
                    if (cellUI == null)
                    {
                        cellUI = cellObj.AddComponent<NurikabeCellUI>();
                    }

                    int row = i;
                    int col = j;
                    int num = numbers[i, j];
                    cellUI.Initialize(row, col, num);
                    cellUI.OnCellClicked += () => OnCellClicked(row, col);

                    // 초기 색상
                    if (num >= 0)
                    {
                        cellUI.SetBackgroundColor(numberColor);
                    }
                    else
                    {
                        cellUI.SetBackgroundColor(unknownColor);
                    }

                    cells[i, j] = cellUI;
                }
            }

            Debug.Log($"Nurikabe grid created: {gridSize}x{gridSize}");
        }

        private void OnCellClicked(int row, int col)
        {
            puzzle?.SelectCell(row, col);
            puzzle?.CycleState(row, col);
        }

        private void OnCellSelected(int row, int col)
        {
            UpdateAllCellColors();
            if (cells[row, col] != null && puzzle.GetNumber(row, col) < 0)
            {
                var currentState = puzzle.GetState(row, col);
                if (currentState == NurikabePuzzle.CellState.Unknown)
                {
                    cells[row, col].SetBackgroundColor(selectedColor);
                }
            }
        }

        private void OnCellStateChanged(int row, int col, NurikabePuzzle.CellState newState)
        {
            if (cells == null || cells[row, col] == null) return;

            cells[row, col].SetState(newState);
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

                    int num = puzzle.GetNumber(i, j);
                    var state = puzzle.GetState(i, j);

                    if (num >= 0)
                    {
                        // 숫자 셀
                        cells[i, j].SetBackgroundColor(numberColor);
                    }
                    else
                    {
                        // 일반 셀
                        Color color = state switch
                        {
                            NurikabePuzzle.CellState.Sea => seaColor,
                            NurikabePuzzle.CellState.Island => islandColor,
                            _ => unknownColor
                        };

                        // 2x2 바다 오류 체크
                        if (state == NurikabePuzzle.CellState.Sea && puzzle.Has2x2SeaAt(i, j))
                        {
                            color = errorColor;
                        }

                        cells[i, j].SetBackgroundColor(color);
                    }
                }
            }
        }
    }

    /// <summary>
    /// Nurikabe 셀 UI
    /// </summary>
    public class NurikabeCellUI : MonoBehaviour
    {
        public int Row { get; private set; }
        public int Col { get; private set; }
        public int Number { get; private set; }
        public NurikabePuzzle.CellState State { get; private set; }

        public event Action OnCellClicked;

        private Image background;
        private TextMeshProUGUI numberText;
        private Button button;

        public void Initialize(int row, int col, int number)
        {
            Row = row;
            Col = col;
            Number = number;
            State = number >= 0 ? NurikabePuzzle.CellState.Island : NurikabePuzzle.CellState.Unknown;

            background = GetComponent<Image>();
            numberText = GetComponentInChildren<TextMeshProUGUI>();
            button = GetComponent<Button>();

            if (numberText != null)
            {
                numberText.text = number >= 0 ? number.ToString() : "";
                numberText.fontStyle = number >= 0 ? FontStyles.Bold : FontStyles.Normal;
                numberText.color = Color.black;
            }

            button?.onClick.AddListener(() => OnCellClicked?.Invoke());
        }

        public void SetState(NurikabePuzzle.CellState newState)
        {
            if (Number >= 0) return; // 숫자 셀은 상태 변경 불가

            State = newState;

            // 바다 셀은 X 마크 또는 아이콘 표시 가능
            if (numberText != null)
            {
                switch (newState)
                {
                    case NurikabePuzzle.CellState.Sea:
                        numberText.text = "";
                        break;
                    case NurikabePuzzle.CellState.Island:
                        numberText.text = "";
                        break;
                    default:
                        numberText.text = "";
                        break;
                }
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

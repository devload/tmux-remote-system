using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System;

namespace PuzzleBattle.Games.Streams
{
    /// <summary>
    /// Streams 퍼즐 UI
    /// 1부터 N까지 연결하는 경로 퍼즐
    /// </summary>
    public class StreamsUI : MonoBehaviour
    {
        [Header("Grid")]
        [SerializeField] private Transform gridContainer;
        [SerializeField] private GameObject cellPrefab;

        [Header("Number Pad")]
        [SerializeField] private Transform numberPadContainer;
        [SerializeField] private GameObject numberButtonPrefab;

        [Header("Colors")]
        [SerializeField] private Color normalColor = Color.white;
        [SerializeField] private Color fixedColor = new Color(0.85f, 0.95f, 0.85f);
        [SerializeField] private Color selectedColor = new Color(0.7f, 0.85f, 1f);
        [SerializeField] private Color pathColor = new Color(0.9f, 0.95f, 1f);
        [SerializeField] private Color errorColor = new Color(1f, 0.7f, 0.7f);

        private StreamsPuzzle puzzle;
        private StreamsCellUI[,] cells;
        private int gridSize;
        private int maxNumber;

        public void Initialize(StreamsPuzzle streamsPuzzle)
        {
            puzzle = streamsPuzzle;

            puzzle.OnPuzzleGenerated -= OnPuzzleGenerated;
            puzzle.OnPuzzleGenerated += OnPuzzleGenerated;
            puzzle.OnCellValueChanged -= OnCellValueChanged;
            puzzle.OnCellValueChanged += OnCellValueChanged;
            puzzle.OnCellSelected -= OnCellSelected;
            puzzle.OnCellSelected += OnCellSelected;
        }

        private void OnDestroy()
        {
            if (puzzle != null)
            {
                puzzle.OnPuzzleGenerated -= OnPuzzleGenerated;
                puzzle.OnCellValueChanged -= OnCellValueChanged;
                puzzle.OnCellSelected -= OnCellSelected;
            }
        }

        private void OnPuzzleGenerated(int[,] grid, bool[,] isFixed, int max)
        {
            gridSize = puzzle.GetGridSize();
            maxNumber = max;
            CreateGrid(grid, isFixed);
            CreateNumberPad();
        }

        private void CreateGrid(int[,] grid, bool[,] isFixed)
        {
            if (gridContainer == null || cellPrefab == null) return;

            // 기존 셀 제거
            foreach (Transform child in gridContainer)
            {
                Destroy(child.gameObject);
            }

            cells = new StreamsCellUI[gridSize, gridSize];

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

                    var cellUI = cellObj.GetComponent<StreamsCellUI>();
                    if (cellUI == null)
                    {
                        cellUI = cellObj.AddComponent<StreamsCellUI>();
                    }

                    int row = i;
                    int col = j;
                    cellUI.Initialize(row, col, grid[i, j], isFixed[i, j], maxNumber);
                    cellUI.OnCellClicked += () => OnCellClicked(row, col);

                    // 색상 설정
                    cellUI.SetBackgroundColor(isFixed[i, j] ? fixedColor : normalColor);

                    cells[i, j] = cellUI;
                }
            }

            Debug.Log($"Streams grid created: {gridSize}x{gridSize}");
        }

        private void CreateNumberPad()
        {
            if (numberPadContainer == null || numberButtonPrefab == null) return;

            // 기존 버튼 제거
            foreach (Transform child in numberPadContainer)
            {
                Destroy(child.gameObject);
            }

            // 1부터 maxNumber까지 버튼 (스크롤 가능하게)
            // 한 줄에 5개씩 표시
            for (int i = 1; i <= maxNumber; i++)
            {
                CreateNumberButton(i);
            }

            // 지우기 버튼
            CreateNumberButton(0, "X");
        }

        private void CreateNumberButton(int number, string label = null)
        {
            var btnObj = Instantiate(numberButtonPrefab, numberPadContainer);
            btnObj.name = $"Btn_{number}";

            var btn = btnObj.GetComponent<Button>();
            var text = btnObj.GetComponentInChildren<TextMeshProUGUI>();

            if (text != null)
            {
                text.text = label ?? number.ToString();
                text.fontSize = number > 9 ? 20 : 24; // 두 자리 숫자는 작게
            }

            int num = number;
            btn?.onClick.AddListener(() => OnNumberClicked(num));
        }

        private void OnCellClicked(int row, int col)
        {
            ClearHighlights();
            puzzle?.SelectCell(row, col);
        }

        private void OnCellSelected(int row, int col)
        {
            HighlightSelection(row, col);
        }

        private void ClearHighlights()
        {
            if (cells == null) return;

            for (int i = 0; i < gridSize; i++)
            {
                for (int j = 0; j < gridSize; j++)
                {
                    if (cells[i, j] != null)
                    {
                        bool isFixed = puzzle?.IsCellFixed(i, j) ?? false;
                        int value = puzzle?.GetCellValue(i, j) ?? 0;

                        if (isFixed)
                            cells[i, j].SetBackgroundColor(fixedColor);
                        else if (value > 0)
                            cells[i, j].SetBackgroundColor(pathColor);
                        else
                            cells[i, j].SetBackgroundColor(normalColor);
                    }
                }
            }
        }

        private void HighlightSelection(int row, int col)
        {
            // 인접한 숫자 하이라이트
            int currentValue = puzzle?.GetCellValue(row, col) ?? 0;

            if (currentValue > 0)
            {
                // 연결된 숫자들 하이라이트
                HighlightConnectedNumbers(currentValue);
            }

            // 선택된 셀
            if (cells[row, col] != null)
                cells[row, col].SetBackgroundColor(selectedColor);
        }

        private void HighlightConnectedNumbers(int number)
        {
            // 인접 숫자 (number-1, number+1) 찾아서 하이라이트
            for (int i = 0; i < gridSize; i++)
            {
                for (int j = 0; j < gridSize; j++)
                {
                    int value = puzzle?.GetCellValue(i, j) ?? 0;
                    if (value == number - 1 || value == number + 1)
                    {
                        cells[i, j]?.SetBackgroundColor(pathColor);
                    }
                }
            }
        }

        private void OnNumberClicked(int number)
        {
            puzzle?.InputNumber(number);
        }

        private void OnCellValueChanged(int row, int col, int value)
        {
            if (cells == null || cells[row, col] == null) return;

            cells[row, col].SetValue(value);

            // 연결 검증
            if (value > 0)
            {
                bool isValid = IsValidPlacement(row, col, value);
                if (!isValid)
                {
                    cells[row, col].SetBackgroundColor(errorColor);
                }
                else
                {
                    cells[row, col].SetBackgroundColor(pathColor);
                }
            }
            else
            {
                cells[row, col].SetBackgroundColor(normalColor);
            }
        }

        private bool IsValidPlacement(int row, int col, int value)
        {
            if (value <= 0) return true;

            int[] dRow = { -1, 1, 0, 0 };
            int[] dCol = { 0, 0, -1, 1 };

            // 같은 숫자가 다른 곳에 있으면 안됨
            for (int i = 0; i < gridSize; i++)
            {
                for (int j = 0; j < gridSize; j++)
                {
                    if (i == row && j == col) continue;
                    if (puzzle?.GetCellValue(i, j) == value) return false;
                }
            }

            // value-1 또는 value+1이 인접해야 함 (value가 1이면 value+1만, maxNumber면 value-1만)
            bool needsPrev = value > 1;
            bool needsNext = value < maxNumber;
            bool hasPrev = false;
            bool hasNext = false;

            for (int d = 0; d < 4; d++)
            {
                int ni = row + dRow[d];
                int nj = col + dCol[d];

                if (ni >= 0 && ni < gridSize && nj >= 0 && nj < gridSize)
                {
                    int neighborValue = puzzle?.GetCellValue(ni, nj) ?? 0;
                    if (neighborValue == value - 1) hasPrev = true;
                    if (neighborValue == value + 1) hasNext = true;
                }
            }

            // 중간 숫자는 양쪽 중 하나라도 연결되어 있으면 OK (퍼즐 진행 중)
            if (needsPrev && needsNext)
            {
                return hasPrev || hasNext;
            }
            else if (needsPrev)
            {
                return hasPrev;
            }
            else if (needsNext)
            {
                return hasNext;
            }

            return true;
        }
    }

    /// <summary>
    /// Streams 셀 UI
    /// </summary>
    public class StreamsCellUI : MonoBehaviour
    {
        public int Row { get; private set; }
        public int Col { get; private set; }
        public int Value { get; private set; }
        public bool IsFixed { get; private set; }

        public event Action OnCellClicked;

        private Image background;
        private TextMeshProUGUI valueText;
        private Button button;
        private int maxNumber;

        public void Initialize(int row, int col, int value, bool isFixed, int max)
        {
            Row = row;
            Col = col;
            Value = value;
            IsFixed = isFixed;
            maxNumber = max;

            background = GetComponent<Image>();
            valueText = GetComponentInChildren<TextMeshProUGUI>();
            button = GetComponent<Button>();

            SetValue(value);
            SetFixed(isFixed);

            button?.onClick.AddListener(() => OnCellClicked?.Invoke());
        }

        public void SetValue(int value)
        {
            Value = value;
            if (valueText != null)
            {
                valueText.text = value == 0 ? "" : value.ToString();
                valueText.fontSize = value > 9 ? 28 : 36; // 두 자리 숫자는 작게
            }
        }

        public void SetFixed(bool isFixed)
        {
            IsFixed = isFixed;
            if (valueText != null)
            {
                valueText.fontStyle = isFixed ? FontStyles.Bold : FontStyles.Normal;
                // 시작점(1)과 끝점(maxNumber)은 특별히 표시
                if (isFixed && (Value == 1 || Value == maxNumber))
                {
                    valueText.color = new Color(0.2f, 0.5f, 0.2f);
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

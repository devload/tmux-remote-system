using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System;
using PuzzleBattle.Core;

namespace PuzzleBattle.Games.Sudoku
{
    /// <summary>
    /// 스도쿠 게임 UI
    /// </summary>
    public class SudokuUI : MonoBehaviour
    {
        [Header("Grid")]
        [SerializeField] private Transform gridContainer;
        [SerializeField] private GameObject cellPrefab;

        [Header("Number Pad")]
        [SerializeField] private Transform numberPadContainer;
        [SerializeField] private GameObject numberButtonPrefab;

        [Header("Colors")]
        [SerializeField] private Color normalColor = Color.white;
        [SerializeField] private Color fixedColor = new Color(0.9f, 0.9f, 0.9f);
        [SerializeField] private Color selectedColor = new Color(0.7f, 0.85f, 1f);
        [SerializeField] private Color highlightColor = new Color(0.9f, 0.95f, 1f);
        [SerializeField] private Color errorColor = new Color(1f, 0.7f, 0.7f);

        private SudokuCell[,] cells = new SudokuCell[9, 9];
        private SudokuPuzzle puzzle;

        private void Awake()
        {
            puzzle = GetComponent<SudokuPuzzle>();
        }

        private void Start()
        {
            if (puzzle != null)
            {
                puzzle.OnPuzzleGenerated += SetupGrid;
                puzzle.OnCellValueChanged += UpdateCell;
                puzzle.OnCellSelected += HighlightSelection;
            }
        }

        private void OnDestroy()
        {
            if (puzzle != null)
            {
                puzzle.OnPuzzleGenerated -= SetupGrid;
                puzzle.OnCellValueChanged -= UpdateCell;
                puzzle.OnCellSelected -= HighlightSelection;
            }
        }

        /// <summary>
        /// 그리드 생성
        /// </summary>
        public void CreateGrid()
        {
            if (gridContainer == null || cellPrefab == null)
            {
                Debug.LogWarning("Grid container or cell prefab not assigned!");
                return;
            }

            foreach (Transform child in gridContainer)
            {
                Destroy(child.gameObject);
            }

            for (int i = 0; i < 9; i++)
            {
                for (int j = 0; j < 9; j++)
                {
                    GameObject cellObj = Instantiate(cellPrefab, gridContainer);
                    cellObj.name = $"Cell_{i}_{j}";

                    SudokuCell cell = cellObj.GetComponent<SudokuCell>();
                    if (cell == null)
                    {
                        cell = cellObj.AddComponent<SudokuCell>();
                    }

                    cell.Initialize(i, j);
                    cell.OnCellClicked += OnCellClicked;

                    cells[i, j] = cell;
                }
            }

            Debug.Log("Sudoku grid created");
        }

        private void SetupGrid(int[,] puzzleData, bool[,] fixedCells)
        {
            if (cells[0, 0] == null)
            {
                CreateGrid();
            }

            for (int i = 0; i < 9; i++)
            {
                for (int j = 0; j < 9; j++)
                {
                    int value = puzzleData[i, j];
                    bool isFixed = fixedCells[i, j];

                    cells[i, j].SetValue(value);
                    cells[i, j].SetFixed(isFixed);
                    cells[i, j].SetBackgroundColor(isFixed ? fixedColor : normalColor);
                }
            }
        }

        private void UpdateCell(int row, int col, int value)
        {
            if (row >= 0 && row < 9 && col >= 0 && col < 9)
            {
                cells[row, col].SetValue(value);

                if (value != 0 && puzzle != null && !puzzle.IsCurrentStateValid())
                {
                    cells[row, col].SetBackgroundColor(errorColor);
                }
                else
                {
                    bool isFixed = puzzle?.IsCellFixed(row, col) ?? false;
                    cells[row, col].SetBackgroundColor(isFixed ? fixedColor : normalColor);
                }
            }
        }

        private void HighlightSelection(int row, int col)
        {
            for (int i = 0; i < 9; i++)
            {
                for (int j = 0; j < 9; j++)
                {
                    bool isFixed = puzzle?.IsCellFixed(i, j) ?? false;
                    cells[i, j].SetBackgroundColor(isFixed ? fixedColor : normalColor);
                }
            }

            for (int i = 0; i < 9; i++)
            {
                if (!puzzle.IsCellFixed(row, i))
                    cells[row, i].SetBackgroundColor(highlightColor);

                if (!puzzle.IsCellFixed(i, col))
                    cells[i, col].SetBackgroundColor(highlightColor);
            }

            int boxStartRow = (row / 3) * 3;
            int boxStartCol = (col / 3) * 3;
            for (int i = 0; i < 3; i++)
            {
                for (int j = 0; j < 3; j++)
                {
                    int r = boxStartRow + i;
                    int c = boxStartCol + j;
                    if (!puzzle.IsCellFixed(r, c))
                        cells[r, c].SetBackgroundColor(highlightColor);
                }
            }

            cells[row, col].SetBackgroundColor(selectedColor);
        }

        private void OnCellClicked(int row, int col)
        {
            puzzle?.SelectCell(row, col);
        }

        public void CreateNumberPad()
        {
            if (numberPadContainer == null || numberButtonPrefab == null)
            {
                Debug.LogWarning("Number pad container or button prefab not assigned!");
                return;
            }

            foreach (Transform child in numberPadContainer)
            {
                Destroy(child.gameObject);
            }

            for (int i = 1; i <= 9; i++)
            {
                CreateNumberButton(i);
            }

            CreateNumberButton(0, "X");
        }

        private void CreateNumberButton(int number, string label = null)
        {
            GameObject btnObj = Instantiate(numberButtonPrefab, numberPadContainer);
            btnObj.name = $"Btn_{number}";

            Button btn = btnObj.GetComponent<Button>();
            TextMeshProUGUI text = btnObj.GetComponentInChildren<TextMeshProUGUI>();

            if (text != null)
            {
                text.text = label ?? number.ToString();
            }

            int num = number;
            btn?.onClick.AddListener(() => OnNumberClicked(num));
        }

        private void OnNumberClicked(int number)
        {
            puzzle?.InputNumber(number);
        }

        public void HighlightSameNumbers(int number)
        {
            if (number == 0) return;

            for (int i = 0; i < 9; i++)
            {
                for (int j = 0; j < 9; j++)
                {
                    if (puzzle?.GetCellValue(i, j) == number)
                    {
                        cells[i, j].SetBackgroundColor(highlightColor);
                    }
                }
            }
        }
    }

    /// <summary>
    /// 개별 스도쿠 셀
    /// </summary>
    public class SudokuCell : MonoBehaviour
    {
        public int Row { get; private set; }
        public int Col { get; private set; }
        public int Value { get; private set; }
        public bool IsFixed { get; private set; }

        public event Action<int, int> OnCellClicked;

        private Image background;
        private TextMeshProUGUI valueText;
        private Button button;

        public void Initialize(int row, int col)
        {
            Row = row;
            Col = col;

            background = GetComponent<Image>();
            valueText = GetComponentInChildren<TextMeshProUGUI>();
            button = GetComponent<Button>();

            button?.onClick.AddListener(() => OnCellClicked?.Invoke(Row, Col));
        }

        public void SetValue(int value)
        {
            Value = value;
            if (valueText != null)
            {
                valueText.text = value == 0 ? "" : value.ToString();
            }
        }

        public void SetFixed(bool isFixed)
        {
            IsFixed = isFixed;
            if (valueText != null)
            {
                valueText.fontStyle = isFixed ? FontStyles.Bold : FontStyles.Normal;
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

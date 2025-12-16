using UnityEngine;
using UnityEngine.UI;
using TMPro;
using PuzzleBattle.Core;
using PuzzleBattle.Games.Sudoku;
using PuzzleBattle.Games.Streams;
using PuzzleBattle.Games.Hitori;
using PuzzleBattle.Games.Nurikabe;

namespace PuzzleBattle.UI
{
    /// <summary>
    /// 게임 플레이 화면 - 모든 퍼즐 타입 지원
    /// </summary>
    public class GameScreen : MonoBehaviour
    {
        [Header("Header")]
        [SerializeField] private TextMeshProUGUI gameNameText;
        [SerializeField] private TextMeshProUGUI timerText;
        [SerializeField] private Button backButton;
        [SerializeField] private Button hintButton;

        [Header("Game Area")]
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

        private PuzzleBase currentPuzzle;
        private PuzzleType currentPuzzleType;
        private GameObject currentPuzzleUI;

        private void Start()
        {
            backButton?.onClick.AddListener(OnBackClicked);
            hintButton?.onClick.AddListener(OnHintClicked);

            if (TimerManager.Instance != null)
            {
                TimerManager.Instance.OnTimeChanged += UpdateTimer;
            }
        }

        private void OnDestroy()
        {
            if (TimerManager.Instance != null)
            {
                TimerManager.Instance.OnTimeChanged -= UpdateTimer;
            }
            CleanupCurrentPuzzle();
        }

        private void OnEnable()
        {
            InitializeGame();
        }

        private void InitializeGame()
        {
            // GameManager에서 현재 퍼즐 타입 가져오기
            if (GameManager.Instance != null)
            {
                currentPuzzleType = GameManager.Instance.CurrentPuzzleType;
            }
            else
            {
                currentPuzzleType = PuzzleType.Sudoku;
            }

            // 기존 퍼즐 정리
            CleanupCurrentPuzzle();

            // 퍼즐 타입에 따라 초기화
            switch (currentPuzzleType)
            {
                case PuzzleType.Sudoku:
                    InitializeSudoku();
                    break;
                case PuzzleType.Streams:
                    InitializeStreams();
                    break;
                case PuzzleType.Hitori:
                    InitializeHitori();
                    break;
                case PuzzleType.Nurikabe:
                    InitializeNurikabe();
                    break;
                default:
                    InitializeSudoku();
                    break;
            }

            // 게임 이름 표시
            if (gameNameText != null)
            {
                gameNameText.text = GetPuzzleName(currentPuzzleType);
            }
        }

        private void CleanupCurrentPuzzle()
        {
            if (currentPuzzleUI != null)
            {
                Destroy(currentPuzzleUI);
                currentPuzzleUI = null;
            }

            if (currentPuzzle != null)
            {
                currentPuzzle.OnPuzzleCompleted -= OnPuzzleCompleted;
                Destroy(currentPuzzle.gameObject);
                currentPuzzle = null;
            }

            // 그리드 컨테이너 정리
            if (gridContainer != null)
            {
                foreach (Transform child in gridContainer)
                {
                    Destroy(child.gameObject);
                }
            }

            // 넘버패드 정리
            if (numberPadContainer != null)
            {
                foreach (Transform child in numberPadContainer)
                {
                    Destroy(child.gameObject);
                }
            }
        }

        private string GetPuzzleName(PuzzleType type)
        {
            return type switch
            {
                PuzzleType.Sudoku => "Sudoku",
                PuzzleType.Streams => "Streams",
                PuzzleType.Hitori => "Hitori",
                PuzzleType.Nurikabe => "Nurikabe",
                _ => type.ToString()
            };
        }

        #region Sudoku

        private void InitializeSudoku()
        {
            // SudokuPuzzle 생성
            var puzzleObj = new GameObject("SudokuPuzzle");
            var sudoku = puzzleObj.AddComponent<SudokuPuzzle>();
            currentPuzzle = sudoku;

            // 이벤트 연결
            sudoku.OnPuzzleGenerated += OnSudokuGenerated;
            sudoku.OnCellValueChanged += OnSudokuCellChanged;
            sudoku.OnPuzzleCompleted += OnPuzzleCompleted;

            // 퍼즐 시작
            sudoku.InitializePuzzle(1);

            // 넘버패드 생성 (1-9)
            CreateNumberPad(9);
        }

        private SudokuCellUI[,] sudokuCells;
        private int sudokuSelectedRow = -1;
        private int sudokuSelectedCol = -1;

        private void OnSudokuGenerated(int[,] puzzle, bool[,] isFixed)
        {
            sudokuCells = new SudokuCellUI[9, 9];

            // GridLayout 설정
            SetupGridLayout(9);

            for (int i = 0; i < 9; i++)
            {
                for (int j = 0; j < 9; j++)
                {
                    var cellObj = Instantiate(cellPrefab, gridContainer);
                    cellObj.name = $"Cell_{i}_{j}";

                    var cellUI = cellObj.GetComponent<SudokuCellUI>();
                    if (cellUI == null)
                    {
                        cellUI = cellObj.AddComponent<SudokuCellUI>();
                    }

                    int row = i;
                    int col = j;
                    cellUI.Initialize(row, col, puzzle[i, j], isFixed[i, j]);
                    cellUI.OnCellClicked += () => OnSudokuCellClicked(row, col);
                    cellUI.SetBackgroundColor(isFixed[i, j] ? fixedColor : normalColor);

                    sudokuCells[i, j] = cellUI;
                }
            }
        }

        private void OnSudokuCellClicked(int row, int col)
        {
            // 하이라이트 해제
            for (int i = 0; i < 9; i++)
            {
                for (int j = 0; j < 9; j++)
                {
                    if (sudokuCells[i, j] != null)
                    {
                        var sudoku = currentPuzzle as SudokuPuzzle;
                        bool isFixed = sudoku?.IsCellFixed(i, j) ?? false;
                        sudokuCells[i, j].SetBackgroundColor(isFixed ? fixedColor : normalColor);
                    }
                }
            }

            sudokuSelectedRow = row;
            sudokuSelectedCol = col;

            // 행/열/박스 하이라이트
            var sudokuPuzzle = currentPuzzle as SudokuPuzzle;
            for (int i = 0; i < 9; i++)
            {
                if (!(sudokuPuzzle?.IsCellFixed(row, i) ?? false))
                    sudokuCells[row, i]?.SetBackgroundColor(highlightColor);
                if (!(sudokuPuzzle?.IsCellFixed(i, col) ?? false))
                    sudokuCells[i, col]?.SetBackgroundColor(highlightColor);
            }

            int boxStartRow = (row / 3) * 3;
            int boxStartCol = (col / 3) * 3;
            for (int i = 0; i < 3; i++)
            {
                for (int j = 0; j < 3; j++)
                {
                    int r = boxStartRow + i;
                    int c = boxStartCol + j;
                    if (!(sudokuPuzzle?.IsCellFixed(r, c) ?? false))
                        sudokuCells[r, c]?.SetBackgroundColor(highlightColor);
                }
            }

            sudokuCells[row, col]?.SetBackgroundColor(selectedColor);
            sudokuPuzzle?.SelectCell(row, col);
        }

        private void OnSudokuCellChanged(int row, int col, int value)
        {
            if (sudokuCells != null && sudokuCells[row, col] != null)
            {
                sudokuCells[row, col].SetValue(value);

                var sudoku = currentPuzzle as SudokuPuzzle;
                if (value != 0 && sudoku != null && !sudoku.IsCurrentStateValid())
                {
                    sudokuCells[row, col].SetBackgroundColor(errorColor);
                }
            }
        }

        #endregion

        #region Streams

        private void InitializeStreams()
        {
            var puzzleObj = new GameObject("StreamsPuzzle");
            var streams = puzzleObj.AddComponent<StreamsPuzzle>();
            currentPuzzle = streams;

            // UI 컴포넌트 생성
            var uiObj = new GameObject("StreamsUI");
            var streamsUI = uiObj.AddComponent<StreamsUI>();
            currentPuzzleUI = uiObj;

            // SerializeField 대신 직접 할당
            SetPrivateField(streamsUI, "gridContainer", gridContainer);
            SetPrivateField(streamsUI, "cellPrefab", cellPrefab);
            SetPrivateField(streamsUI, "numberPadContainer", numberPadContainer);
            SetPrivateField(streamsUI, "numberButtonPrefab", numberButtonPrefab);

            streamsUI.Initialize(streams);
            streams.OnPuzzleCompleted += OnPuzzleCompleted;
            streams.InitializePuzzle(1);
        }

        #endregion

        #region Hitori

        private void InitializeHitori()
        {
            var puzzleObj = new GameObject("HitoriPuzzle");
            var hitori = puzzleObj.AddComponent<HitoriPuzzle>();
            currentPuzzle = hitori;

            var uiObj = new GameObject("HitoriUI");
            var hitoriUI = uiObj.AddComponent<HitoriUI>();
            currentPuzzleUI = uiObj;

            SetPrivateField(hitoriUI, "gridContainer", gridContainer);
            SetPrivateField(hitoriUI, "cellPrefab", cellPrefab);

            hitoriUI.Initialize(hitori);
            hitori.OnPuzzleCompleted += OnPuzzleCompleted;
            hitori.InitializePuzzle(1);

            // Hitori는 넘버패드 필요 없음 (터치로 토글)
            if (numberPadContainer != null)
            {
                numberPadContainer.gameObject.SetActive(false);
            }
        }

        #endregion

        #region Nurikabe

        private void InitializeNurikabe()
        {
            var puzzleObj = new GameObject("NurikabePuzzle");
            var nurikabe = puzzleObj.AddComponent<NurikabePuzzle>();
            currentPuzzle = nurikabe;

            var uiObj = new GameObject("NurikabeUI");
            var nurikabeUI = uiObj.AddComponent<NurikabeUI>();
            currentPuzzleUI = uiObj;

            SetPrivateField(nurikabeUI, "gridContainer", gridContainer);
            SetPrivateField(nurikabeUI, "cellPrefab", cellPrefab);

            nurikabeUI.Initialize(nurikabe);
            nurikabe.OnPuzzleCompleted += OnPuzzleCompleted;
            nurikabe.InitializePuzzle(1);

            // Nurikabe도 넘버패드 필요 없음 (터치로 상태 순환)
            if (numberPadContainer != null)
            {
                numberPadContainer.gameObject.SetActive(false);
            }
        }

        #endregion

        #region Common

        private void SetupGridLayout(int size)
        {
            var gridLayout = gridContainer.GetComponent<GridLayoutGroup>();
            if (gridLayout != null)
            {
                var rectTransform = gridContainer as RectTransform;
                if (rectTransform != null)
                {
                    float containerWidth = rectTransform.rect.width;
                    if (containerWidth <= 0) containerWidth = 400; // 기본값
                    float spacing = gridLayout.spacing.x;
                    float cellSize = (containerWidth - (size - 1) * spacing) / size;
                    gridLayout.cellSize = new Vector2(cellSize, cellSize);
                    gridLayout.constraint = GridLayoutGroup.Constraint.FixedColumnCount;
                    gridLayout.constraintCount = size;
                }
            }
        }

        private void CreateNumberPad(int maxNumber)
        {
            if (numberPadContainer == null || numberButtonPrefab == null) return;

            numberPadContainer.gameObject.SetActive(true);

            foreach (Transform child in numberPadContainer)
            {
                Destroy(child.gameObject);
            }

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
            }

            int num = number;
            btn?.onClick.AddListener(() => OnNumberClicked(num));
        }

        private void OnNumberClicked(int number)
        {
            if (currentPuzzleType == PuzzleType.Sudoku)
            {
                var sudoku = currentPuzzle as SudokuPuzzle;
                if (sudokuSelectedRow >= 0 && sudokuSelectedCol >= 0)
                {
                    if (!(sudoku?.IsCellFixed(sudokuSelectedRow, sudokuSelectedCol) ?? true))
                    {
                        sudoku?.InputNumber(number);
                    }
                }
            }
            else if (currentPuzzleType == PuzzleType.Streams)
            {
                var streams = currentPuzzle as StreamsPuzzle;
                streams?.InputNumber(number);
            }
        }

        private void SetPrivateField<T>(object obj, string fieldName, T value)
        {
            var field = obj.GetType().GetField(fieldName,
                System.Reflection.BindingFlags.NonPublic |
                System.Reflection.BindingFlags.Instance);
            field?.SetValue(obj, value);
        }

        private void UpdateTimer(float time)
        {
            if (timerText != null && TimerManager.Instance != null)
            {
                timerText.text = TimerManager.Instance.GetFormattedTime();

                if (time <= 10f)
                    timerText.color = Color.red;
                else if (time <= 30f)
                    timerText.color = new Color(1f, 0.5f, 0f);
                else
                    timerText.color = Color.white;
            }
        }

        private void OnPuzzleCompleted()
        {
            Debug.Log($"{currentPuzzleType} Puzzle Completed!");
            GameManager.Instance?.CompleteCurrentPuzzle();
            ScreenManager.Instance?.GoToResult();
        }

        private void OnBackClicked()
        {
            TimerManager.Instance?.StopTimer();
            ScreenManager.Instance?.GoToMain();
        }

        private void OnHintClicked()
        {
            currentPuzzle?.ProvideHint();
        }

        #endregion
    }

    /// <summary>
    /// 스도쿠 셀 UI
    /// </summary>
    public class SudokuCellUI : MonoBehaviour
    {
        public int Row { get; private set; }
        public int Col { get; private set; }
        public int Value { get; private set; }
        public bool IsFixed { get; private set; }

        public event System.Action OnCellClicked;

        private Image background;
        private TextMeshProUGUI valueText;
        private Button button;

        public void Initialize(int row, int col, int value, bool isFixed)
        {
            Row = row;
            Col = col;
            Value = value;
            IsFixed = isFixed;

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

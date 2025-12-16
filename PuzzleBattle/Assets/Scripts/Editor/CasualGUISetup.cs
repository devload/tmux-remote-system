using UnityEngine;
using UnityEngine.UI;
using UnityEditor;
using TMPro;
using PuzzleBattle.UI;

namespace PuzzleBattle.Editor
{
    /// <summary>
    /// Casual GUI 에셋을 적용한 UI 생성기
    /// </summary>
    public class CasualGUISetup : MonoBehaviour
    {
        // 에셋 경로
        private const string ASSET_PATH = "Assets/Casual GUI Mobile game UI pack/";
        private const string PNG_PATH = ASSET_PATH + "ui/PNG/";
        private const string PREFAB_PATH = ASSET_PATH + "Prefabs/";

        // 색상 팔레트
        public static class Colors
        {
            public static Color bgPurple = new Color(0.35f, 0.25f, 0.55f);
            public static Color bgBlue = new Color(0.25f, 0.45f, 0.75f);
            public static Color panelBg = new Color(0.95f, 0.92f, 0.85f);
            public static Color panelBorder = new Color(0.55f, 0.4f, 0.25f);
            public static Color textDark = new Color(0.3f, 0.2f, 0.15f);
            public static Color green = new Color(0.4f, 0.75f, 0.35f);
            public static Color orange = new Color(0.95f, 0.55f, 0.2f);
            public static Color blue = new Color(0.35f, 0.55f, 0.9f);
            public static Color yellow = new Color(1f, 0.85f, 0.3f);
            public static Color red = new Color(0.9f, 0.35f, 0.35f);
        }

        [MenuItem("PuzzleBattle/Setup Casual GUI (Purchased Asset)")]
        public static void SetupCasualGUI()
        {
            // 기존 캔버스 제거
            var existingCanvas = Object.FindObjectOfType<Canvas>();
            if (existingCanvas != null)
            {
                DestroyImmediate(existingCanvas.gameObject);
            }

            // 기존 ScreenManager 제거
            var existingScreenManager = Object.FindObjectOfType<ScreenManager>();
            if (existingScreenManager != null)
            {
                DestroyImmediate(existingScreenManager.gameObject);
            }

            var canvasObj = CreateCanvas();

            var loginScreen = CreateLoginScreen(canvasObj.transform);
            var mainScreen = CreateMainScreen(canvasObj.transform);
            var gameScreen = CreateGameScreen(canvasObj.transform);
            var resultScreen = CreateResultScreen(canvasObj.transform);

            // ScreenManager 생성
            var screenManagerObj = new GameObject("ScreenManager");
            var screenManager = screenManagerObj.AddComponent<ScreenManager>();

            var so = new SerializedObject(screenManager);
            so.FindProperty("loginScreen").objectReferenceValue = loginScreen;
            so.FindProperty("mainScreen").objectReferenceValue = mainScreen;
            so.FindProperty("gameScreen").objectReferenceValue = gameScreen;
            so.FindProperty("resultScreen").objectReferenceValue = resultScreen;
            so.ApplyModifiedProperties();

            // Managers 생성
            CreateManagers();

            // 프리팹 생성
            CreateGameItemPrefab();
            CreateCellPrefab();
            CreateNumberButtonPrefab();

            Debug.Log("=== Casual GUI Setup Complete! ===");
        }

        private static GameObject CreateCanvas()
        {
            var canvasObj = new GameObject("MainCanvas");
            var canvas = canvasObj.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;

            var scaler = canvasObj.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1080, 1920);
            scaler.matchWidthOrHeight = 0.5f;

            canvasObj.AddComponent<GraphicRaycaster>();

            if (Object.FindObjectOfType<UnityEngine.EventSystems.EventSystem>() == null)
            {
                var eventSystem = new GameObject("EventSystem");
                eventSystem.AddComponent<UnityEngine.EventSystems.EventSystem>();
                eventSystem.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();
            }

            return canvasObj;
        }

        #region Login Screen

        private static GameObject CreateLoginScreen(Transform parent)
        {
            var screen = new GameObject("LoginScreen");
            screen.transform.SetParent(parent, false);
            var screenRect = screen.AddComponent<RectTransform>();
            screenRect.anchorMin = Vector2.zero;
            screenRect.anchorMax = Vector2.one;
            screenRect.sizeDelta = Vector2.zero;

            // 배경 이미지 로드
            var bgSprite = LoadSprite(PNG_PATH + "2.0_ PNG/backgrounds/background1.png");
            var bgImage = screen.AddComponent<Image>();
            if (bgSprite != null)
            {
                bgImage.sprite = bgSprite;
                bgImage.type = Image.Type.Sliced;
            }
            else
            {
                bgImage.color = Colors.bgPurple;
            }

            // 로고 패널
            var logoPanel = CreateStyledPanel(screen.transform, "LogoPanel", 600, 180);
            SetRectTransform(logoPanel, new Vector2(0.5f, 0.7f), new Vector2(0.5f, 0.7f), Vector2.zero, new Vector2(600, 180));

            // 타이틀
            var title = CreateStyledText(logoPanel.transform, "Title", "PUZZLE BATTLE", 52, Colors.yellow);
            SetRectTransform(title, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(550, 80));
            title.GetComponent<TextMeshProUGUI>().fontStyle = FontStyles.Bold;

            // 서브타이틀
            var subtitle = CreateStyledText(screen.transform, "Subtitle", "Daily Brain Training", 24, Color.white);
            SetRectTransform(subtitle, new Vector2(0.5f, 0.55f), new Vector2(0.5f, 0.55f), Vector2.zero, new Vector2(400, 40));

            // PLAY 버튼 - 에셋의 버튼 스프라이트 사용
            var playBtn = CreateStyledButton(screen.transform, "PlayButton", "PLAY", Colors.green, 40, 350, 90);
            SetRectTransform(playBtn, new Vector2(0.5f, 0.35f), new Vector2(0.5f, 0.35f), Vector2.zero, new Vector2(350, 90));

            // 소셜 로그인 버튼
            var googleBtn = CreateStyledButton(screen.transform, "GoogleBtn", "Sign in with Google", Colors.panelBg, 22, 300, 60, Colors.textDark);
            SetRectTransform(googleBtn, new Vector2(0.5f, 0.2f), new Vector2(0.5f, 0.2f), Vector2.zero, new Vector2(300, 60));

            // LoginScreen 컴포넌트
            var loginScreen = screen.AddComponent<LoginScreen>();
            var loginSo = new SerializedObject(loginScreen);
            loginSo.FindProperty("loginButton").objectReferenceValue = playBtn.GetComponent<Button>();
            loginSo.FindProperty("titleText").objectReferenceValue = title.GetComponent<TextMeshProUGUI>();
            loginSo.ApplyModifiedProperties();

            return screen;
        }

        #endregion

        #region Main Screen

        private static GameObject CreateMainScreen(Transform parent)
        {
            var screen = new GameObject("MainScreen");
            screen.transform.SetParent(parent, false);
            var screenRect = screen.AddComponent<RectTransform>();
            screenRect.anchorMin = Vector2.zero;
            screenRect.anchorMax = Vector2.one;
            screenRect.sizeDelta = Vector2.zero;
            screen.SetActive(false);

            // 배경
            var bgSprite = LoadSprite(PNG_PATH + "2.0_ PNG/backgrounds/background2.png");
            var bgImage = screen.AddComponent<Image>();
            if (bgSprite != null)
            {
                bgImage.sprite = bgSprite;
                bgImage.type = Image.Type.Sliced;
            }
            else
            {
                bgImage.color = Colors.bgBlue;
            }

            // 상단 헤더
            var header = CreatePanel(screen.transform, "Header", new Color(0.2f, 0.15f, 0.35f, 0.95f));
            SetRectTransform(header, new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -70), new Vector2(0, 140));

            // 프로필 영역
            var profilePanel = CreateStyledPanel(header.transform, "ProfilePanel", 70, 70);
            SetRectTransform(profilePanel, new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(55, 0), new Vector2(70, 70));

            var welcomeText = CreateStyledText(header.transform, "WelcomeText", "Hello, Player!", 26, Color.white);
            SetRectTransform(welcomeText, new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(170, 12), new Vector2(220, 36));
            welcomeText.GetComponent<TextMeshProUGUI>().alignment = TextAlignmentOptions.Left;

            var progressText = CreateStyledText(header.transform, "ProgressText", "Level 1", 18, Colors.yellow);
            SetRectTransform(progressText, new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(170, -16), new Vector2(180, 28));
            progressText.GetComponent<TextMeshProUGUI>().alignment = TextAlignmentOptions.Left;

            // 코인 표시
            var coinPanel = CreateStyledPanel(header.transform, "CoinPanel", 130, 45);
            SetRectTransform(coinPanel, new Vector2(1, 0.5f), new Vector2(1, 0.5f), new Vector2(-85, 0), new Vector2(130, 45));
            var coinText = CreateStyledText(coinPanel.transform, "CoinText", "1,250", 20, Colors.textDark);
            SetRectTransform(coinText, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);

            // 오늘의 퍼즐 타이틀
            var todayTitle = CreateStyledText(screen.transform, "TodayTitle", "TODAY'S PUZZLES", 32, Colors.yellow);
            SetRectTransform(todayTitle, new Vector2(0.5f, 0.82f), new Vector2(0.5f, 0.82f), Vector2.zero, new Vector2(500, 50));
            todayTitle.GetComponent<TextMeshProUGUI>().fontStyle = FontStyles.Bold;

            // 게임 리스트 배경
            var gameListBg = CreateStyledPanel(screen.transform, "GameListBg", 950, 680);
            SetRectTransform(gameListBg, new Vector2(0.5f, 0.45f), new Vector2(0.5f, 0.45f), Vector2.zero, new Vector2(950, 680));

            var gameListContainer = new GameObject("GameListContainer");
            gameListContainer.transform.SetParent(gameListBg.transform, false);
            var containerRect = gameListContainer.AddComponent<RectTransform>();
            SetRectTransform(gameListContainer, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(880, 620));

            var verticalLayout = gameListContainer.AddComponent<VerticalLayoutGroup>();
            verticalLayout.spacing = 20;
            verticalLayout.childAlignment = TextAnchor.UpperCenter;
            verticalLayout.childControlWidth = true;
            verticalLayout.childControlHeight = false;
            verticalLayout.childForceExpandWidth = true;
            verticalLayout.childForceExpandHeight = false;
            verticalLayout.padding = new RectOffset(10, 10, 15, 15);

            // 하단 탭바
            var tabBar = CreatePanel(screen.transform, "TabBar", new Color(0.15f, 0.1f, 0.25f, 0.98f));
            SetRectTransform(tabBar, new Vector2(0, 0), new Vector2(1, 0), new Vector2(0, 55), new Vector2(0, 110));

            var tabLayout = tabBar.AddComponent<HorizontalLayoutGroup>();
            tabLayout.spacing = 8;
            tabLayout.padding = new RectOffset(15, 15, 8, 8);
            tabLayout.childAlignment = TextAnchor.MiddleCenter;
            tabLayout.childControlWidth = true;
            tabLayout.childControlHeight = true;
            tabLayout.childForceExpandWidth = true;

            var homeTab = CreateTabButton(tabBar.transform, "HomeTab", "Home", true);
            var rankTab = CreateTabButton(tabBar.transform, "RankingTab", "Rank", false);
            var shopTab = CreateTabButton(tabBar.transform, "ShopTab", "Shop", false);
            var settingsTab = CreateTabButton(tabBar.transform, "SettingsTab", "Settings", false);

            // MainScreen 컴포넌트
            var mainScreen = screen.AddComponent<MainScreen>();
            var so = new SerializedObject(mainScreen);
            so.FindProperty("gameListContainer").objectReferenceValue = gameListContainer.transform;
            so.FindProperty("homeTab").objectReferenceValue = homeTab.GetComponent<Button>();
            so.FindProperty("rankingTab").objectReferenceValue = rankTab.GetComponent<Button>();
            so.FindProperty("shopTab").objectReferenceValue = shopTab.GetComponent<Button>();
            so.FindProperty("settingsTab").objectReferenceValue = settingsTab.GetComponent<Button>();
            so.FindProperty("welcomeText").objectReferenceValue = welcomeText.GetComponent<TextMeshProUGUI>();
            so.FindProperty("progressText").objectReferenceValue = progressText.GetComponent<TextMeshProUGUI>();

            var gameItemPrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Prefabs/UI/GameItem.prefab");
            so.FindProperty("gameItemPrefab").objectReferenceValue = gameItemPrefab;
            so.ApplyModifiedProperties();

            return screen;
        }

        #endregion

        #region Game Screen

        private static GameObject CreateGameScreen(Transform parent)
        {
            var screen = new GameObject("GameScreen");
            screen.transform.SetParent(parent, false);
            var screenRect = screen.AddComponent<RectTransform>();
            screenRect.anchorMin = Vector2.zero;
            screenRect.anchorMax = Vector2.one;
            screenRect.sizeDelta = Vector2.zero;
            screen.SetActive(false);

            // 배경
            var bgSprite = LoadSprite(PNG_PATH + "2.0_ PNG/backgrounds/background3.png");
            var bgImage = screen.AddComponent<Image>();
            if (bgSprite != null)
            {
                bgImage.sprite = bgSprite;
                bgImage.type = Image.Type.Sliced;
            }
            else
            {
                bgImage.color = Colors.bgBlue;
            }

            // 상단 헤더
            var header = CreatePanel(screen.transform, "Header", new Color(0.15f, 0.1f, 0.3f, 0.95f));
            SetRectTransform(header, new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -50), new Vector2(0, 100));

            // 뒤로가기 버튼
            var backBtn = CreateStyledButton(header.transform, "BackButton", "<", Colors.red, 28, 55, 55);
            SetRectTransform(backBtn, new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(45, 0), new Vector2(55, 55));

            // 게임 이름
            var gameNameText = CreateStyledText(header.transform, "GameName", "SUDOKU", 34, Colors.yellow);
            SetRectTransform(gameNameText, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(220, 45));
            gameNameText.GetComponent<TextMeshProUGUI>().fontStyle = FontStyles.Bold;

            // 타이머
            var timerPanel = CreateStyledPanel(header.transform, "TimerPanel", 120, 48);
            SetRectTransform(timerPanel, new Vector2(1, 0.5f), new Vector2(1, 0.5f), new Vector2(-80, 0), new Vector2(120, 48));

            var timerText = CreateStyledText(timerPanel.transform, "Timer", "05:00", 22, Colors.textDark);
            SetRectTransform(timerText, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            timerText.GetComponent<TextMeshProUGUI>().fontStyle = FontStyles.Bold;

            // 그리드 패널
            var gridPanel = CreateStyledPanel(screen.transform, "GridPanel", 700, 700);
            SetRectTransform(gridPanel, new Vector2(0.5f, 0.52f), new Vector2(0.5f, 0.52f), Vector2.zero, new Vector2(700, 700));

            var gridContainer = new GameObject("GridContainer");
            gridContainer.transform.SetParent(gridPanel.transform, false);
            var gridRect = gridContainer.AddComponent<RectTransform>();
            SetRectTransform(gridContainer, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(660, 660));

            var gridLayout = gridContainer.AddComponent<GridLayoutGroup>();
            gridLayout.cellSize = new Vector2(70, 70);
            gridLayout.spacing = new Vector2(4, 4);
            gridLayout.startCorner = GridLayoutGroup.Corner.UpperLeft;
            gridLayout.startAxis = GridLayoutGroup.Axis.Horizontal;
            gridLayout.childAlignment = TextAnchor.MiddleCenter;
            gridLayout.constraint = GridLayoutGroup.Constraint.FixedColumnCount;
            gridLayout.constraintCount = 9;

            // 숫자 패드
            var numberPadBg = CreateStyledPanel(screen.transform, "NumberPadBg", 720, 80);
            SetRectTransform(numberPadBg, new Vector2(0.5f, 0.12f), new Vector2(0.5f, 0.12f), Vector2.zero, new Vector2(720, 80));

            var numberPad = new GameObject("NumberPad");
            numberPad.transform.SetParent(numberPadBg.transform, false);
            var numPadRect = numberPad.AddComponent<RectTransform>();
            SetRectTransform(numberPad, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(690, 65));

            var numberPadLayout = numberPad.AddComponent<HorizontalLayoutGroup>();
            numberPadLayout.spacing = 6;
            numberPadLayout.childAlignment = TextAnchor.MiddleCenter;
            numberPadLayout.childControlWidth = true;
            numberPadLayout.childControlHeight = true;
            numberPadLayout.childForceExpandWidth = true;

            // 힌트 버튼
            var hintBtn = CreateStyledButton(screen.transform, "HintButton", "HINT", Colors.orange, 22, 150, 50);
            SetRectTransform(hintBtn, new Vector2(0.5f, 0.03f), new Vector2(0.5f, 0.03f), Vector2.zero, new Vector2(150, 50));

            // GameScreen 컴포넌트
            var gameScreen = screen.AddComponent<GameScreen>();
            var so = new SerializedObject(gameScreen);
            so.FindProperty("gameNameText").objectReferenceValue = gameNameText.GetComponent<TextMeshProUGUI>();
            so.FindProperty("timerText").objectReferenceValue = timerText.GetComponent<TextMeshProUGUI>();
            so.FindProperty("backButton").objectReferenceValue = backBtn.GetComponent<Button>();
            so.FindProperty("hintButton").objectReferenceValue = hintBtn.GetComponent<Button>();
            so.FindProperty("gridContainer").objectReferenceValue = gridContainer.transform;
            so.FindProperty("numberPadContainer").objectReferenceValue = numberPad.transform;

            var cellPrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Prefabs/UI/Cell.prefab");
            var numBtnPrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Prefabs/UI/NumberButton.prefab");
            so.FindProperty("cellPrefab").objectReferenceValue = cellPrefab;
            so.FindProperty("numberButtonPrefab").objectReferenceValue = numBtnPrefab;
            so.ApplyModifiedProperties();

            return screen;
        }

        #endregion

        #region Result Screen

        private static GameObject CreateResultScreen(Transform parent)
        {
            var screen = new GameObject("ResultScreen");
            screen.transform.SetParent(parent, false);
            var screenRect = screen.AddComponent<RectTransform>();
            screenRect.anchorMin = Vector2.zero;
            screenRect.anchorMax = Vector2.one;
            screenRect.sizeDelta = Vector2.zero;
            screen.SetActive(false);

            // 배경
            var bgSprite = LoadSprite(PNG_PATH + "2.0_ PNG/backgrounds/background4.png");
            var bgImage = screen.AddComponent<Image>();
            if (bgSprite != null)
            {
                bgImage.sprite = bgSprite;
                bgImage.type = Image.Type.Sliced;
            }
            else
            {
                bgImage.color = new Color(0.4f, 0.3f, 0.6f);
            }

            // 성공 타이틀
            var successTitle = CreateStyledText(screen.transform, "SuccessTitle", "EXCELLENT!", 56, Colors.yellow);
            SetRectTransform(successTitle, new Vector2(0.5f, 0.75f), new Vector2(0.5f, 0.75f), Vector2.zero, new Vector2(500, 80));
            successTitle.GetComponent<TextMeshProUGUI>().fontStyle = FontStyles.Bold;

            // 별 이미지
            var starsText = CreateStyledText(screen.transform, "StarsDisplay", "★★★", 60, Colors.yellow);
            SetRectTransform(starsText, new Vector2(0.5f, 0.63f), new Vector2(0.5f, 0.63f), Vector2.zero, new Vector2(350, 80));

            // 스코어 패널
            var scorePanel = CreateStyledPanel(screen.transform, "ScorePanel", 420, 220);
            SetRectTransform(scorePanel, new Vector2(0.5f, 0.4f), new Vector2(0.5f, 0.4f), Vector2.zero, new Vector2(420, 220));

            var scoreLabel = CreateStyledText(scorePanel.transform, "ScoreLabel", "YOUR SCORE", 22, Colors.textDark);
            SetRectTransform(scoreLabel, new Vector2(0.5f, 0.82f), new Vector2(0.5f, 0.82f), Vector2.zero, new Vector2(250, 35));

            var scoreText = CreateStyledText(scorePanel.transform, "ScoreText", "1,250", 52, Colors.orange);
            SetRectTransform(scoreText, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(320, 75));
            scoreText.GetComponent<TextMeshProUGUI>().fontStyle = FontStyles.Bold;

            var bonusText = CreateStyledText(scorePanel.transform, "BonusText", "+50 Coins", 20, Colors.green);
            SetRectTransform(bonusText, new Vector2(0.5f, 0.2f), new Vector2(0.5f, 0.2f), Vector2.zero, new Vector2(200, 35));

            // CONTINUE 버튼
            var continueBtn = CreateStyledButton(screen.transform, "ContinueButton", "CONTINUE", Colors.green, 28, 300, 70);
            SetRectTransform(continueBtn, new Vector2(0.5f, 0.12f), new Vector2(0.5f, 0.12f), Vector2.zero, new Vector2(300, 70));

            continueBtn.GetComponent<Button>().onClick.AddListener(() => {
                ScreenManager.Instance?.GoToMain();
            });

            return screen;
        }

        #endregion

        #region Prefabs

        private static void CreateGameItemPrefab()
        {
            var itemObj = new GameObject("GameItem");
            var rect = itemObj.AddComponent<RectTransform>();
            rect.sizeDelta = new Vector2(850, 130);

            // 배경
            var bgSprite = LoadSprite(PNG_PATH + "bg/123_0009_bg-brown.png");
            var bgImage = itemObj.AddComponent<Image>();
            if (bgSprite != null)
            {
                bgImage.sprite = bgSprite;
                bgImage.type = Image.Type.Sliced;
            }
            else
            {
                bgImage.color = Colors.panelBg;
            }

            // 색상 바
            var colorBar = new GameObject("ColorBar");
            colorBar.transform.SetParent(itemObj.transform, false);
            var colorBarRect = colorBar.AddComponent<RectTransform>();
            colorBarRect.anchorMin = new Vector2(0, 0);
            colorBarRect.anchorMax = new Vector2(0, 1);
            colorBarRect.sizeDelta = new Vector2(10, -10);
            colorBarRect.anchoredPosition = new Vector2(8, 0);
            var colorBarImage = colorBar.AddComponent<Image>();
            colorBarImage.color = Colors.blue;

            // 아이콘
            var iconObj = new GameObject("Icon");
            iconObj.transform.SetParent(itemObj.transform, false);
            var iconRect = iconObj.AddComponent<RectTransform>();
            iconRect.anchorMin = new Vector2(0, 0.5f);
            iconRect.anchorMax = new Vector2(0, 0.5f);
            iconRect.sizeDelta = new Vector2(85, 85);
            iconRect.anchoredPosition = new Vector2(70, 0);
            var iconImage = iconObj.AddComponent<Image>();
            iconImage.color = Colors.blue;

            var iconText = CreateStyledText(iconObj.transform, "IconText", "?", 40, Color.white);
            SetRectTransform(iconText, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);

            // 게임 이름
            var nameText = CreateStyledText(itemObj.transform, "GameName", "Sudoku", 30, Colors.textDark);
            SetRectTransform(nameText, new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(185, 16), new Vector2(280, 42));
            nameText.GetComponent<TextMeshProUGUI>().alignment = TextAlignmentOptions.Left;
            nameText.GetComponent<TextMeshProUGUI>().fontStyle = FontStyles.Bold;

            // 상태 텍스트
            var statusText = CreateStyledText(itemObj.transform, "Status", "Tap to Play!", 18, Colors.green);
            SetRectTransform(statusText, new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(185, -18), new Vector2(280, 30));
            statusText.GetComponent<TextMeshProUGUI>().alignment = TextAlignmentOptions.Left;

            // 플레이 버튼
            var playBtn = CreateStyledButton(itemObj.transform, "PlayButton", ">", Colors.green, 28, 65, 65);
            var playBtnRect = playBtn.GetComponent<RectTransform>();
            playBtnRect.anchorMin = new Vector2(1, 0.5f);
            playBtnRect.anchorMax = new Vector2(1, 0.5f);
            playBtnRect.sizeDelta = new Vector2(65, 65);
            playBtnRect.anchoredPosition = new Vector2(-50, 0);

            // 컴포넌트
            var gameItemUI = itemObj.AddComponent<GameItemUI>();
            var so = new SerializedObject(gameItemUI);
            so.FindProperty("backgroundImage").objectReferenceValue = bgImage;
            so.FindProperty("iconImage").objectReferenceValue = iconImage;
            so.FindProperty("gameNameText").objectReferenceValue = nameText.GetComponent<TextMeshProUGUI>();
            so.FindProperty("statusText").objectReferenceValue = statusText.GetComponent<TextMeshProUGUI>();
            so.FindProperty("playButton").objectReferenceValue = playBtn.GetComponent<Button>();
            so.FindProperty("colorBar").objectReferenceValue = colorBarImage;
            so.FindProperty("iconText").objectReferenceValue = iconText.GetComponent<TextMeshProUGUI>();
            so.ApplyModifiedProperties();

            EnsureDirectoryExists("Assets/Prefabs/UI");
            PrefabUtility.SaveAsPrefabAsset(itemObj, "Assets/Prefabs/UI/GameItem.prefab");
            DestroyImmediate(itemObj);
        }

        private static void CreateCellPrefab()
        {
            var cellObj = new GameObject("Cell");
            var rect = cellObj.AddComponent<RectTransform>();
            rect.sizeDelta = new Vector2(70, 70);

            var image = cellObj.AddComponent<Image>();
            image.color = Colors.panelBg;

            var button = cellObj.AddComponent<Button>();
            button.targetGraphic = image;

            var colors = button.colors;
            colors.highlightedColor = Colors.yellow;
            colors.pressedColor = Colors.orange;
            colors.selectedColor = new Color(0.85f, 0.95f, 1f);
            button.colors = colors;

            var textObj = CreateStyledText(cellObj.transform, "Text", "", 34, Colors.textDark);
            SetRectTransform(textObj, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            textObj.GetComponent<TextMeshProUGUI>().fontStyle = FontStyles.Bold;

            EnsureDirectoryExists("Assets/Prefabs/UI");
            PrefabUtility.SaveAsPrefabAsset(cellObj, "Assets/Prefabs/UI/Cell.prefab");
            DestroyImmediate(cellObj);
        }

        private static void CreateNumberButtonPrefab()
        {
            var btnObj = new GameObject("NumberButton");
            var rect = btnObj.AddComponent<RectTransform>();
            rect.sizeDelta = new Vector2(62, 62);

            var image = btnObj.AddComponent<Image>();
            image.color = Colors.blue;

            var button = btnObj.AddComponent<Button>();
            button.targetGraphic = image;

            var colors = button.colors;
            colors.highlightedColor = new Color(0.45f, 0.65f, 1f);
            colors.pressedColor = new Color(0.25f, 0.45f, 0.8f);
            button.colors = colors;

            var textObj = CreateStyledText(btnObj.transform, "Text", "1", 28, Color.white);
            SetRectTransform(textObj, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            textObj.GetComponent<TextMeshProUGUI>().fontStyle = FontStyles.Bold;

            EnsureDirectoryExists("Assets/Prefabs/UI");
            PrefabUtility.SaveAsPrefabAsset(btnObj, "Assets/Prefabs/UI/NumberButton.prefab");
            DestroyImmediate(btnObj);
        }

        #endregion

        #region Managers

        private static void CreateManagers()
        {
            var existingGameManager = Object.FindObjectOfType<PuzzleBattle.Core.GameManager>();
            if (existingGameManager != null)
                DestroyImmediate(existingGameManager.gameObject);

            var existingTimerManager = Object.FindObjectOfType<PuzzleBattle.Core.TimerManager>();
            if (existingTimerManager != null)
                DestroyImmediate(existingTimerManager.gameObject);

            var existingScoreManager = Object.FindObjectOfType<PuzzleBattle.Core.ScoreManager>();
            if (existingScoreManager != null)
                DestroyImmediate(existingScoreManager.gameObject);

            var gameManagerObj = new GameObject("GameManager");
            gameManagerObj.AddComponent<PuzzleBattle.Core.GameManager>();

            var timerManagerObj = new GameObject("TimerManager");
            timerManagerObj.AddComponent<PuzzleBattle.Core.TimerManager>();

            var scoreManagerObj = new GameObject("ScoreManager");
            scoreManagerObj.AddComponent<PuzzleBattle.Core.ScoreManager>();
        }

        #endregion

        #region Helper Methods

        private static Sprite LoadSprite(string path)
        {
            return AssetDatabase.LoadAssetAtPath<Sprite>(path);
        }

        private static GameObject CreatePanel(Transform parent, string name, Color color)
        {
            var panel = new GameObject(name);
            panel.transform.SetParent(parent, false);
            panel.AddComponent<RectTransform>();

            if (color.a > 0)
            {
                var image = panel.AddComponent<Image>();
                image.color = color;
            }

            return panel;
        }

        private static GameObject CreateStyledPanel(Transform parent, string name, float width, float height)
        {
            var panel = new GameObject(name);
            panel.transform.SetParent(parent, false);

            var rect = panel.AddComponent<RectTransform>();
            rect.sizeDelta = new Vector2(width, height);

            // 에셋의 패널 스프라이트 로드 시도
            var panelSprite = LoadSprite(PNG_PATH + "bg/123_0008_bg-blue.png");
            var image = panel.AddComponent<Image>();

            if (panelSprite != null)
            {
                image.sprite = panelSprite;
                image.type = Image.Type.Sliced;
            }
            else
            {
                image.color = Colors.panelBg;

                var outline = panel.AddComponent<Outline>();
                outline.effectColor = Colors.panelBorder;
                outline.effectDistance = new Vector2(3, -3);
            }

            return panel;
        }

        private static GameObject CreateStyledButton(Transform parent, string name, string text,
            Color bgColor, int fontSize, float width, float height, Color? textColor = null)
        {
            var btnObj = new GameObject(name);
            btnObj.transform.SetParent(parent, false);

            var rect = btnObj.AddComponent<RectTransform>();
            rect.sizeDelta = new Vector2(width, height);

            // 버튼 스프라이트 로드 시도
            string btnSpritePath = PNG_PATH + "buttons/35_bttn/bttn-big22.png";
            if (bgColor == Colors.green)
                btnSpritePath = PNG_PATH + "buttons/35_bttn/bttn-big22.png";
            else if (bgColor == Colors.orange)
                btnSpritePath = PNG_PATH + "buttons/35_bttn/bttn-big23.png";
            else if (bgColor == Colors.red)
                btnSpritePath = PNG_PATH + "buttons/35_bttn/bttn-big24.png";

            var btnSprite = LoadSprite(btnSpritePath);
            var image = btnObj.AddComponent<Image>();

            if (btnSprite != null)
            {
                image.sprite = btnSprite;
                image.type = Image.Type.Sliced;
            }
            else
            {
                image.color = bgColor;

                var outline = btnObj.AddComponent<Outline>();
                outline.effectColor = new Color(bgColor.r * 0.6f, bgColor.g * 0.6f, bgColor.b * 0.6f);
                outline.effectDistance = new Vector2(2, -2);
            }

            var button = btnObj.AddComponent<Button>();
            button.targetGraphic = image;

            var colors = button.colors;
            colors.highlightedColor = new Color(1f, 1f, 1f, 0.9f);
            colors.pressedColor = new Color(0.85f, 0.85f, 0.85f, 1f);
            button.colors = colors;

            var textObj = CreateStyledText(btnObj.transform, "Text", text, fontSize, textColor ?? Color.white);
            SetRectTransform(textObj, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            textObj.GetComponent<TextMeshProUGUI>().fontStyle = FontStyles.Bold;

            return btnObj;
        }

        private static GameObject CreateTabButton(Transform parent, string name, string label, bool isActive)
        {
            var btnObj = new GameObject(name);
            btnObj.transform.SetParent(parent, false);

            var rect = btnObj.AddComponent<RectTransform>();
            rect.sizeDelta = new Vector2(90, 90);

            var image = btnObj.AddComponent<Image>();
            image.color = isActive ? new Color(0.5f, 0.3f, 0.7f, 0.8f) : new Color(0, 0, 0, 0);

            var button = btnObj.AddComponent<Button>();
            button.targetGraphic = image;

            var labelText = CreateStyledText(btnObj.transform, "Label", label, 16, isActive ? Colors.yellow : new Color(0.7f, 0.7f, 0.8f));
            SetRectTransform(labelText, new Vector2(0.5f, 0.3f), new Vector2(0.5f, 0.3f), Vector2.zero, new Vector2(85, 25));
            labelText.GetComponent<TextMeshProUGUI>().fontStyle = FontStyles.Bold;

            return btnObj;
        }

        private static GameObject CreateStyledText(Transform parent, string name, string text, int fontSize, Color color)
        {
            var textObj = new GameObject(name);
            textObj.transform.SetParent(parent, false);
            textObj.AddComponent<RectTransform>();

            var tmp = textObj.AddComponent<TextMeshProUGUI>();
            tmp.text = text;
            tmp.fontSize = fontSize;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = color;

            return textObj;
        }

        private static void SetRectTransform(GameObject obj, Vector2 anchorMin, Vector2 anchorMax,
            Vector2 anchoredPos, Vector2 sizeDelta)
        {
            var rect = obj.GetComponent<RectTransform>();
            rect.anchorMin = anchorMin;
            rect.anchorMax = anchorMax;
            rect.anchoredPosition = anchoredPos;
            rect.sizeDelta = sizeDelta;
        }

        private static void EnsureDirectoryExists(string path)
        {
            if (!AssetDatabase.IsValidFolder(path))
            {
                string[] folders = path.Split('/');
                string currentPath = folders[0];

                for (int i = 1; i < folders.Length; i++)
                {
                    string newPath = currentPath + "/" + folders[i];
                    if (!AssetDatabase.IsValidFolder(newPath))
                    {
                        AssetDatabase.CreateFolder(currentPath, folders[i]);
                    }
                    currentPath = newPath;
                }
            }
        }

        #endregion
    }
}

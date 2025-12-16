using UnityEngine;
using UnityEngine.UI;
using UnityEditor;
using TMPro;
using PuzzleBattle.UI;

namespace PuzzleBattle.Editor
{
    /// <summary>
    /// Candy Crush 스타일 UI 생성기
    /// </summary>
    public class CandyStyleUI : MonoBehaviour
    {
        // Candy Crush 컬러 팔레트
        public static class CandyColors
        {
            // 배경 그라데이션
            public static Color bgTop = new Color(0.4f, 0.2f, 0.6f);      // 보라
            public static Color bgBottom = new Color(0.2f, 0.4f, 0.8f);   // 파랑

            // 주요 색상
            public static Color pink = new Color(1f, 0.4f, 0.6f);          // 핑크
            public static Color purple = new Color(0.6f, 0.3f, 0.8f);      // 보라
            public static Color blue = new Color(0.3f, 0.6f, 1f);          // 파랑
            public static Color orange = new Color(1f, 0.6f, 0.2f);        // 주황
            public static Color green = new Color(0.4f, 0.8f, 0.4f);       // 초록
            public static Color yellow = new Color(1f, 0.85f, 0.3f);       // 노랑
            public static Color red = new Color(1f, 0.35f, 0.35f);         // 빨강

            // UI 색상
            public static Color buttonPrimary = new Color(0.3f, 0.75f, 0.3f);   // 초록 버튼
            public static Color buttonSecondary = new Color(0.9f, 0.5f, 0.2f);  // 주황 버튼
            public static Color panelBg = new Color(0.95f, 0.9f, 0.8f);         // 베이지 패널
            public static Color panelBorder = new Color(0.6f, 0.4f, 0.2f);      // 갈색 테두리
            public static Color textDark = new Color(0.3f, 0.2f, 0.1f);         // 갈색 텍스트
            public static Color textLight = Color.white;
            public static Color gold = new Color(1f, 0.8f, 0.2f);               // 골드
        }

        [MenuItem("PuzzleBattle/Setup Candy Style UI")]
        public static void SetupCandyUI()
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

            var loginScreen = CreateCandyLoginScreen(canvasObj.transform);
            var mainScreen = CreateCandyMainScreen(canvasObj.transform);
            var gameScreen = CreateCandyGameScreen(canvasObj.transform);
            var resultScreen = CreateCandyResultScreen(canvasObj.transform);

            // ScreenManager를 별도 게임오브젝트로 생성
            Debug.Log("Creating ScreenManager...");
            var screenManagerObj = new GameObject("ScreenManager");
            Debug.Log($"ScreenManager GameObject created: {screenManagerObj != null}");

            var screenManager = screenManagerObj.AddComponent<ScreenManager>();
            Debug.Log($"ScreenManager component added: {screenManager != null}");

            var so = new SerializedObject(screenManager);
            so.FindProperty("loginScreen").objectReferenceValue = loginScreen;
            so.FindProperty("mainScreen").objectReferenceValue = mainScreen;
            so.FindProperty("gameScreen").objectReferenceValue = gameScreen;
            so.FindProperty("resultScreen").objectReferenceValue = resultScreen;
            so.ApplyModifiedProperties();

            Debug.Log($"ScreenManager setup complete. Screens assigned: Login={loginScreen != null}, Main={mainScreen != null}, Game={gameScreen != null}, Result={resultScreen != null}");

            // GameManager, TimerManager, ScoreManager 생성
            CreateManagers();

            CreateCandyGameItemPrefab();
            CreateCandyCellPrefab();
            CreateCandyNumberButtonPrefab();

            Debug.Log("=== Candy Style UI Setup Complete! ===");
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

        private static GameObject CreateCandyLoginScreen(Transform parent)
        {
            var screen = CreateGradientBackground(parent, "LoginScreen", CandyColors.bgTop, CandyColors.bgBottom);

            // 상단 장식 (구름/별)
            CreateDecorations(screen.transform);

            // 로고 영역 - 반짝이는 타이틀
            var logoPanel = CreateCandyPanel(screen.transform, "LogoPanel", 500, 200);
            SetRectTransform(logoPanel, new Vector2(0.5f, 0.72f), new Vector2(0.5f, 0.72f), Vector2.zero, new Vector2(500, 200));

            // 메인 타이틀
            var title = CreateOutlinedText(screen.transform, "Title", "PUZZLE", 72, CandyColors.yellow, CandyColors.panelBorder);
            SetRectTransform(title, new Vector2(0.5f, 0.68f), new Vector2(0.5f, 0.68f), Vector2.zero, new Vector2(600, 100));

            var title2 = CreateOutlinedText(screen.transform, "Title2", "BATTLE", 72, CandyColors.pink, CandyColors.panelBorder);
            SetRectTransform(title2, new Vector2(0.5f, 0.58f), new Vector2(0.5f, 0.58f), Vector2.zero, new Vector2(600, 100));

            // 별 장식
            var stars = CreateText(screen.transform, "Stars", "✨ ⭐ ✨", 40);
            SetRectTransform(stars, new Vector2(0.5f, 0.50f), new Vector2(0.5f, 0.50f), Vector2.zero, new Vector2(300, 60));

            // 서브타이틀
            var subtitle = CreateText(screen.transform, "Subtitle", "Daily Puzzle Fun!", 28);
            SetRectTransform(subtitle, new Vector2(0.5f, 0.44f), new Vector2(0.5f, 0.44f), Vector2.zero, new Vector2(400, 50));
            subtitle.GetComponent<TextMeshProUGUI>().color = Color.white;

            // 플레이 버튼 (큰 초록색)
            var playBtn = CreateCandyButton(screen.transform, "PlayButton", "PLAY!",
                CandyColors.buttonPrimary, 36, 380, 90);
            SetRectTransform(playBtn, new Vector2(0.5f, 0.28f), new Vector2(0.5f, 0.28f), Vector2.zero, new Vector2(380, 90));

            // 소셜 로그인 버튼들
            var googleBtn = CreateCandyButton(screen.transform, "GoogleBtn", "📧 Google",
                CandyColors.panelBg, 22, 280, 55, CandyColors.textDark);
            SetRectTransform(googleBtn, new Vector2(0.5f, 0.16f), new Vector2(0.5f, 0.16f), Vector2.zero, new Vector2(280, 55));

            // 하단 장식
            var bottomDecor = CreateText(screen.transform, "BottomDecor", "🍬 🍭 🍫 🍬 🍭 🍫", 30);
            SetRectTransform(bottomDecor, new Vector2(0.5f, 0.05f), new Vector2(0.5f, 0.05f), Vector2.zero, new Vector2(500, 50));

            // LoginScreen 컴포넌트
            var loginScreen = screen.AddComponent<LoginScreen>();
            var so = new SerializedObject(loginScreen);
            so.FindProperty("loginButton").objectReferenceValue = playBtn.GetComponent<Button>();
            so.FindProperty("titleText").objectReferenceValue = title.GetComponent<TextMeshProUGUI>();
            so.ApplyModifiedProperties();

            return screen;
        }

        #endregion

        #region Main Screen

        private static GameObject CreateCandyMainScreen(Transform parent)
        {
            var screen = CreateGradientBackground(parent, "MainScreen",
                new Color(0.3f, 0.5f, 0.9f), new Color(0.5f, 0.3f, 0.7f));
            screen.SetActive(false);

            // 상단 헤더
            var header = CreatePanel(screen.transform, "Header", new Color(0.2f, 0.15f, 0.4f, 0.9f));
            SetRectTransform(header, new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -75), new Vector2(0, 150));

            // 프로필 영역
            var profileIcon = CreateCandyIcon(header.transform, "ProfileIcon", "😊", CandyColors.yellow, 70);
            SetRectTransform(profileIcon, new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(60, 0), new Vector2(70, 70));

            var welcomeText = CreateText(header.transform, "WelcomeText", "Hello, Player!", 28);
            SetRectTransform(welcomeText, new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(180, 12), new Vector2(250, 40));
            welcomeText.GetComponent<TextMeshProUGUI>().alignment = TextAlignmentOptions.Left;
            welcomeText.GetComponent<TextMeshProUGUI>().fontStyle = FontStyles.Bold;

            var progressText = CreateText(header.transform, "ProgressText", "⭐ Level 1", 20);
            SetRectTransform(progressText, new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(180, -18), new Vector2(200, 30));
            progressText.GetComponent<TextMeshProUGUI>().alignment = TextAlignmentOptions.Left;
            progressText.GetComponent<TextMeshProUGUI>().color = CandyColors.yellow;

            // 코인/보석 표시
            var coinPanel = CreateCandyPanel(header.transform, "CoinPanel", 130, 45);
            SetRectTransform(coinPanel, new Vector2(1, 0.5f), new Vector2(1, 0.5f), new Vector2(-90, 0), new Vector2(130, 45));
            var coinText = CreateText(coinPanel.transform, "CoinText", "🪙 1,250", 20);
            SetRectTransform(coinText, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            coinText.GetComponent<TextMeshProUGUI>().color = CandyColors.textDark;

            // 오늘의 퍼즐 타이틀
            var todayTitle = CreateOutlinedText(screen.transform, "TodayTitle", "🎮 TODAY'S PUZZULAR!", 32,
                CandyColors.yellow, CandyColors.panelBorder);
            SetRectTransform(todayTitle, new Vector2(0.5f, 0.82f), new Vector2(0.5f, 0.82f), Vector2.zero, new Vector2(600, 60));

            // 게임 리스트 영역
            var gameListBg = CreateCandyPanel(screen.transform, "GameListBg", 950, 700);
            SetRectTransform(gameListBg, new Vector2(0.5f, 0.45f), new Vector2(0.5f, 0.45f), Vector2.zero, new Vector2(950, 700));

            var gameListContainer = CreatePanel(gameListBg.transform, "GameListContainer", new Color(0, 0, 0, 0));
            SetRectTransform(gameListContainer, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(880, 640));

            var verticalLayout = gameListContainer.AddComponent<VerticalLayoutGroup>();
            verticalLayout.spacing = 20;
            verticalLayout.childAlignment = TextAnchor.UpperCenter;
            verticalLayout.childControlWidth = true;
            verticalLayout.childControlHeight = false;
            verticalLayout.childForceExpandWidth = true;
            verticalLayout.childForceExpandHeight = false;
            verticalLayout.padding = new RectOffset(15, 15, 15, 15);

            // 하단 탭바
            var tabBar = CreatePanel(screen.transform, "TabBar", new Color(0.15f, 0.1f, 0.3f, 0.95f));
            SetRectTransform(tabBar, new Vector2(0, 0), new Vector2(1, 0), new Vector2(0, 60), new Vector2(0, 120));

            var tabLayout = tabBar.AddComponent<HorizontalLayoutGroup>();
            tabLayout.spacing = 10;
            tabLayout.padding = new RectOffset(20, 20, 10, 10);
            tabLayout.childAlignment = TextAnchor.MiddleCenter;
            tabLayout.childControlWidth = true;
            tabLayout.childControlHeight = true;
            tabLayout.childForceExpandWidth = true;

            var homeTab = CreateCandyTabButton(tabBar.transform, "HomeTab", "🏠", "Home", true);
            var rankTab = CreateCandyTabButton(tabBar.transform, "RankingTab", "🏆", "Rank", false);
            var shopTab = CreateCandyTabButton(tabBar.transform, "ShopTab", "🛍️", "Shop", false);
            var settingsTab = CreateCandyTabButton(tabBar.transform, "SettingsTab", "⚙️", "Settings", false);

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

        private static GameObject CreateCandyGameScreen(Transform parent)
        {
            var screen = CreateGradientBackground(parent, "GameScreen",
                new Color(0.2f, 0.5f, 0.8f), new Color(0.4f, 0.2f, 0.6f));
            screen.SetActive(false);

            // 상단 헤더
            var header = CreatePanel(screen.transform, "Header", new Color(0.15f, 0.1f, 0.3f, 0.9f));
            SetRectTransform(header, new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -50), new Vector2(0, 100));

            // 뒤로가기 버튼
            var backBtn = CreateCandyIconButton(header.transform, "BackButton", "←", CandyColors.red, 55);
            SetRectTransform(backBtn, new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(50, 0), new Vector2(55, 55));

            // 게임 이름
            var gameNameText = CreateOutlinedText(header.transform, "GameName", "SUDOKU", 36,
                CandyColors.yellow, CandyColors.panelBorder);
            SetRectTransform(gameNameText, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(250, 50));

            // 타이머
            var timerPanel = CreateCandyPanel(header.transform, "TimerPanel", 120, 50);
            SetRectTransform(timerPanel, new Vector2(1, 0.5f), new Vector2(1, 0.5f), new Vector2(-80, 0), new Vector2(120, 50));

            var timerText = CreateText(timerPanel.transform, "Timer", "⏱️ 05:00", 22);
            SetRectTransform(timerText, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            timerText.GetComponent<TextMeshProUGUI>().color = CandyColors.textDark;
            timerText.GetComponent<TextMeshProUGUI>().fontStyle = FontStyles.Bold;

            // 그리드 영역 (Candy 스타일 패널)
            var gridPanel = CreateCandyPanel(screen.transform, "GridPanel", 720, 720);
            SetRectTransform(gridPanel, new Vector2(0.5f, 0.52f), new Vector2(0.5f, 0.52f), Vector2.zero, new Vector2(720, 720));

            var gridContainer = CreatePanel(gridPanel.transform, "GridContainer", new Color(0, 0, 0, 0));
            SetRectTransform(gridContainer, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(680, 680));

            var gridLayout = gridContainer.AddComponent<GridLayoutGroup>();
            gridLayout.cellSize = new Vector2(72, 72);
            gridLayout.spacing = new Vector2(4, 4);
            gridLayout.startCorner = GridLayoutGroup.Corner.UpperLeft;
            gridLayout.startAxis = GridLayoutGroup.Axis.Horizontal;
            gridLayout.childAlignment = TextAnchor.MiddleCenter;
            gridLayout.constraint = GridLayoutGroup.Constraint.FixedColumnCount;
            gridLayout.constraintCount = 9;

            // 숫자 패드
            var numberPadBg = CreateCandyPanel(screen.transform, "NumberPadBg", 750, 85);
            SetRectTransform(numberPadBg, new Vector2(0.5f, 0.12f), new Vector2(0.5f, 0.12f), Vector2.zero, new Vector2(750, 85));

            var numberPad = CreatePanel(numberPadBg.transform, "NumberPad", new Color(0, 0, 0, 0));
            SetRectTransform(numberPad, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(720, 70));

            var numberPadLayout = numberPad.AddComponent<HorizontalLayoutGroup>();
            numberPadLayout.spacing = 8;
            numberPadLayout.childAlignment = TextAnchor.MiddleCenter;
            numberPadLayout.childControlWidth = true;
            numberPadLayout.childControlHeight = true;
            numberPadLayout.childForceExpandWidth = true;

            // 힌트 버튼
            var hintBtn = CreateCandyButton(screen.transform, "HintButton", "💡 HINT",
                CandyColors.orange, 22, 160, 55);
            SetRectTransform(hintBtn, new Vector2(0.5f, 0.03f), new Vector2(0.5f, 0.03f), Vector2.zero, new Vector2(160, 55));

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

        private static GameObject CreateCandyResultScreen(Transform parent)
        {
            var screen = CreateGradientBackground(parent, "ResultScreen",
                new Color(0.5f, 0.3f, 0.7f), new Color(0.3f, 0.2f, 0.5f));
            screen.SetActive(false);

            // 축하 장식
            var celebrationTop = CreateText(screen.transform, "CelebrationTop", "🎉 ⭐ 🎊 ⭐ 🎉", 45);
            SetRectTransform(celebrationTop, new Vector2(0.5f, 0.92f), new Vector2(0.5f, 0.92f), Vector2.zero, new Vector2(500, 70));

            // 성공 아이콘
            var successIcon = CreateCandyIcon(screen.transform, "SuccessIcon", "🏆", CandyColors.gold, 150);
            SetRectTransform(successIcon, new Vector2(0.5f, 0.72f), new Vector2(0.5f, 0.72f), Vector2.zero, new Vector2(150, 150));

            // 성공 타이틀
            var successTitle = CreateOutlinedText(screen.transform, "SuccessTitle", "SWEET!", 64,
                CandyColors.yellow, CandyColors.panelBorder);
            SetRectTransform(successTitle, new Vector2(0.5f, 0.58f), new Vector2(0.5f, 0.58f), Vector2.zero, new Vector2(500, 90));

            // 스코어 패널
            var scorePanel = CreateCandyPanel(screen.transform, "ScorePanel", 450, 250);
            SetRectTransform(scorePanel, new Vector2(0.5f, 0.38f), new Vector2(0.5f, 0.38f), Vector2.zero, new Vector2(450, 250));

            var scoreLabel = CreateText(scorePanel.transform, "ScoreLabel", "YOUR SCORE", 22);
            SetRectTransform(scoreLabel, new Vector2(0.5f, 0.85f), new Vector2(0.5f, 0.85f), Vector2.zero, new Vector2(250, 35));
            scoreLabel.GetComponent<TextMeshProUGUI>().color = CandyColors.textDark;

            var scoreText = CreateOutlinedText(scorePanel.transform, "ScoreText", "1,250", 56,
                CandyColors.orange, new Color(0.5f, 0.3f, 0.1f));
            SetRectTransform(scoreText, new Vector2(0.5f, 0.55f), new Vector2(0.5f, 0.55f), Vector2.zero, new Vector2(350, 80));

            var starsText = CreateText(scorePanel.transform, "StarsText", "⭐⭐⭐", 45);
            SetRectTransform(starsText, new Vector2(0.5f, 0.25f), new Vector2(0.5f, 0.25f), Vector2.zero, new Vector2(250, 60));

            // 보상 텍스트
            var rewardText = CreateText(screen.transform, "RewardText", "🪙 +50 Coins!", 28);
            SetRectTransform(rewardText, new Vector2(0.5f, 0.2f), new Vector2(0.5f, 0.2f), Vector2.zero, new Vector2(300, 45));
            rewardText.GetComponent<TextMeshProUGUI>().color = CandyColors.yellow;

            // 계속 버튼
            var continueBtn = CreateCandyButton(screen.transform, "ContinueButton", "CONTINUE →",
                CandyColors.buttonPrimary, 28, 320, 75);
            SetRectTransform(continueBtn, new Vector2(0.5f, 0.08f), new Vector2(0.5f, 0.08f), Vector2.zero, new Vector2(320, 75));

            continueBtn.GetComponent<Button>().onClick.AddListener(() => {
                ScreenManager.Instance?.GoToMain();
            });

            return screen;
        }

        #endregion

        #region Prefabs

        private static void CreateCandyGameItemPrefab()
        {
            var itemObj = new GameObject("GameItem");

            var rect = itemObj.AddComponent<RectTransform>();
            rect.sizeDelta = new Vector2(850, 140);

            // 배경 패널 (Candy 스타일)
            var bgImage = itemObj.AddComponent<Image>();
            bgImage.color = CandyColors.panelBg;

            // 테두리 효과
            var outline = itemObj.AddComponent<Outline>();
            outline.effectColor = CandyColors.panelBorder;
            outline.effectDistance = new Vector2(3, -3);

            // 왼쪽 색상 바
            var colorBar = new GameObject("ColorBar");
            colorBar.transform.SetParent(itemObj.transform, false);
            var colorBarRect = colorBar.AddComponent<RectTransform>();
            colorBarRect.anchorMin = new Vector2(0, 0);
            colorBarRect.anchorMax = new Vector2(0, 1);
            colorBarRect.sizeDelta = new Vector2(12, 0);
            colorBarRect.anchoredPosition = new Vector2(6, 0);
            var colorBarImage = colorBar.AddComponent<Image>();
            colorBarImage.color = CandyColors.blue;

            // 게임 아이콘 (원형 배경)
            var iconObj = new GameObject("Icon");
            iconObj.transform.SetParent(itemObj.transform, false);
            var iconRect = iconObj.AddComponent<RectTransform>();
            iconRect.anchorMin = new Vector2(0, 0.5f);
            iconRect.anchorMax = new Vector2(0, 0.5f);
            iconRect.sizeDelta = new Vector2(90, 90);
            iconRect.anchoredPosition = new Vector2(75, 0);
            var iconImage = iconObj.AddComponent<Image>();
            iconImage.color = CandyColors.purple;

            var iconOutline = iconObj.AddComponent<Outline>();
            iconOutline.effectColor = new Color(0.4f, 0.2f, 0.5f);
            iconOutline.effectDistance = new Vector2(2, -2);

            var iconText = CreateText(iconObj.transform, "IconText", "🔢", 42);
            SetRectTransform(iconText, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);

            // 텍스트 영역
            var nameText = CreateText(itemObj.transform, "GameName", "Sudoku", 32);
            SetRectTransform(nameText, new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(195, 18), new Vector2(300, 45));
            nameText.GetComponent<TextMeshProUGUI>().alignment = TextAlignmentOptions.Left;
            nameText.GetComponent<TextMeshProUGUI>().fontStyle = FontStyles.Bold;
            nameText.GetComponent<TextMeshProUGUI>().color = CandyColors.textDark;

            var statusText = CreateText(itemObj.transform, "Status", "Tap to Play!", 20);
            SetRectTransform(statusText, new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(195, -20), new Vector2(300, 32));
            statusText.GetComponent<TextMeshProUGUI>().alignment = TextAlignmentOptions.Left;
            statusText.GetComponent<TextMeshProUGUI>().color = CandyColors.green;

            // 플레이 버튼
            var playBtn = CreateCandyIconButton(itemObj.transform, "PlayButton", "▶", CandyColors.buttonPrimary, 70);
            var playBtnRect = playBtn.GetComponent<RectTransform>();
            playBtnRect.anchorMin = new Vector2(1, 0.5f);
            playBtnRect.anchorMax = new Vector2(1, 0.5f);
            playBtnRect.sizeDelta = new Vector2(70, 70);
            playBtnRect.anchoredPosition = new Vector2(-55, 0);

            // 컴포넌트 추가
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

            Debug.Log("Candy GameItem prefab created");
        }

        private static void CreateCandyCellPrefab()
        {
            var cellObj = new GameObject("Cell");

            var rect = cellObj.AddComponent<RectTransform>();
            rect.sizeDelta = new Vector2(72, 72);

            var image = cellObj.AddComponent<Image>();
            image.color = CandyColors.panelBg;

            var outline = cellObj.AddComponent<Outline>();
            outline.effectColor = CandyColors.panelBorder;
            outline.effectDistance = new Vector2(2, -2);

            var button = cellObj.AddComponent<Button>();
            button.targetGraphic = image;

            var colors = button.colors;
            colors.highlightedColor = CandyColors.yellow;
            colors.pressedColor = CandyColors.orange;
            colors.selectedColor = CandyColors.blue;
            button.colors = colors;

            var textObj = new GameObject("Text");
            textObj.transform.SetParent(cellObj.transform, false);
            var textRect = textObj.AddComponent<RectTransform>();
            textRect.anchorMin = Vector2.zero;
            textRect.anchorMax = Vector2.one;
            textRect.sizeDelta = Vector2.zero;

            var tmp = textObj.AddComponent<TextMeshProUGUI>();
            tmp.text = "";
            tmp.fontSize = 36;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = CandyColors.textDark;
            tmp.fontStyle = FontStyles.Bold;

            EnsureDirectoryExists("Assets/Prefabs/UI");
            PrefabUtility.SaveAsPrefabAsset(cellObj, "Assets/Prefabs/UI/Cell.prefab");
            DestroyImmediate(cellObj);

            Debug.Log("Candy Cell prefab created");
        }

        private static void CreateCandyNumberButtonPrefab()
        {
            var btnObj = new GameObject("NumberButton");

            var rect = btnObj.AddComponent<RectTransform>();
            rect.sizeDelta = new Vector2(65, 65);

            var image = btnObj.AddComponent<Image>();
            image.color = CandyColors.blue;

            var outline = btnObj.AddComponent<Outline>();
            outline.effectColor = new Color(0.2f, 0.4f, 0.7f);
            outline.effectDistance = new Vector2(2, -2);

            var button = btnObj.AddComponent<Button>();
            button.targetGraphic = image;

            var colors = button.colors;
            colors.highlightedColor = new Color(0.4f, 0.7f, 1f);
            colors.pressedColor = new Color(0.2f, 0.5f, 0.8f);
            button.colors = colors;

            var textObj = new GameObject("Text");
            textObj.transform.SetParent(btnObj.transform, false);
            var textRect = textObj.AddComponent<RectTransform>();
            textRect.anchorMin = Vector2.zero;
            textRect.anchorMax = Vector2.one;
            textRect.sizeDelta = Vector2.zero;

            var tmp = textObj.AddComponent<TextMeshProUGUI>();
            tmp.text = "1";
            tmp.fontSize = 30;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = Color.white;
            tmp.fontStyle = FontStyles.Bold;

            EnsureDirectoryExists("Assets/Prefabs/UI");
            PrefabUtility.SaveAsPrefabAsset(btnObj, "Assets/Prefabs/UI/NumberButton.prefab");
            DestroyImmediate(btnObj);

            Debug.Log("Candy NumberButton prefab created");
        }

        #endregion

        #region Managers

        private static void CreateManagers()
        {
            // 기존 매니저들 제거
            var existingGameManager = Object.FindObjectOfType<PuzzleBattle.Core.GameManager>();
            if (existingGameManager != null)
                DestroyImmediate(existingGameManager.gameObject);

            var existingTimerManager = Object.FindObjectOfType<PuzzleBattle.Core.TimerManager>();
            if (existingTimerManager != null)
                DestroyImmediate(existingTimerManager.gameObject);

            var existingScoreManager = Object.FindObjectOfType<PuzzleBattle.Core.ScoreManager>();
            if (existingScoreManager != null)
                DestroyImmediate(existingScoreManager.gameObject);

            // GameManager 생성
            var gameManagerObj = new GameObject("GameManager");
            gameManagerObj.AddComponent<PuzzleBattle.Core.GameManager>();
            Debug.Log("GameManager created");

            // TimerManager 생성
            var timerManagerObj = new GameObject("TimerManager");
            timerManagerObj.AddComponent<PuzzleBattle.Core.TimerManager>();
            Debug.Log("TimerManager created");

            // ScoreManager 생성
            var scoreManagerObj = new GameObject("ScoreManager");
            scoreManagerObj.AddComponent<PuzzleBattle.Core.ScoreManager>();
            Debug.Log("ScoreManager created");
        }

        #endregion

        #region Helper Methods

        private static GameObject CreateGradientBackground(Transform parent, string name, Color topColor, Color bottomColor)
        {
            var panel = new GameObject(name);
            panel.transform.SetParent(parent, false);

            var rect = panel.AddComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.sizeDelta = Vector2.zero;

            // 상단 색상
            var topPanel = new GameObject("TopGradient");
            topPanel.transform.SetParent(panel.transform, false);
            var topRect = topPanel.AddComponent<RectTransform>();
            topRect.anchorMin = new Vector2(0, 0.5f);
            topRect.anchorMax = Vector2.one;
            topRect.sizeDelta = Vector2.zero;
            var topImage = topPanel.AddComponent<Image>();
            topImage.color = topColor;

            // 하단 색상
            var bottomPanel = new GameObject("BottomGradient");
            bottomPanel.transform.SetParent(panel.transform, false);
            var bottomRect = bottomPanel.AddComponent<RectTransform>();
            bottomRect.anchorMin = Vector2.zero;
            bottomRect.anchorMax = new Vector2(1, 0.5f);
            bottomRect.sizeDelta = Vector2.zero;
            var bottomImage = bottomPanel.AddComponent<Image>();
            bottomImage.color = bottomColor;

            return panel;
        }

        private static void CreateDecorations(Transform parent)
        {
            // 구름/별 장식들
            string[] decorations = { "☁️", "⭐", "✨", "☁️", "⭐" };
            float[] xPositions = { 0.1f, 0.25f, 0.5f, 0.75f, 0.9f };
            float[] yPositions = { 0.88f, 0.92f, 0.95f, 0.91f, 0.87f };

            for (int i = 0; i < decorations.Length; i++)
            {
                var decor = CreateText(parent, $"Decor{i}", decorations[i], 35);
                SetRectTransform(decor, new Vector2(xPositions[i], yPositions[i]),
                    new Vector2(xPositions[i], yPositions[i]), Vector2.zero, new Vector2(60, 60));
            }
        }

        private static GameObject CreateCandyPanel(Transform parent, string name, float width, float height)
        {
            var panel = new GameObject(name);
            panel.transform.SetParent(parent, false);

            var rect = panel.AddComponent<RectTransform>();
            rect.sizeDelta = new Vector2(width, height);

            var image = panel.AddComponent<Image>();
            image.color = CandyColors.panelBg;

            var outline = panel.AddComponent<Outline>();
            outline.effectColor = CandyColors.panelBorder;
            outline.effectDistance = new Vector2(4, -4);

            return panel;
        }

        private static GameObject CreateCandyButton(Transform parent, string name, string text,
            Color bgColor, int fontSize, float width, float height, Color? textColor = null)
        {
            var btnObj = new GameObject(name);
            btnObj.transform.SetParent(parent, false);

            var rect = btnObj.AddComponent<RectTransform>();
            rect.sizeDelta = new Vector2(width, height);

            var image = btnObj.AddComponent<Image>();
            image.color = bgColor;

            var outline = btnObj.AddComponent<Outline>();
            outline.effectColor = new Color(bgColor.r * 0.6f, bgColor.g * 0.6f, bgColor.b * 0.6f);
            outline.effectDistance = new Vector2(3, -3);

            var button = btnObj.AddComponent<Button>();
            button.targetGraphic = image;

            var colors = button.colors;
            colors.highlightedColor = new Color(bgColor.r * 1.1f, bgColor.g * 1.1f, bgColor.b * 1.1f);
            colors.pressedColor = new Color(bgColor.r * 0.85f, bgColor.g * 0.85f, bgColor.b * 0.85f);
            button.colors = colors;

            var textObj = new GameObject("Text");
            textObj.transform.SetParent(btnObj.transform, false);
            var textRect = textObj.AddComponent<RectTransform>();
            textRect.anchorMin = Vector2.zero;
            textRect.anchorMax = Vector2.one;
            textRect.sizeDelta = Vector2.zero;

            var tmp = textObj.AddComponent<TextMeshProUGUI>();
            tmp.text = text;
            tmp.fontSize = fontSize;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = textColor ?? Color.white;
            tmp.fontStyle = FontStyles.Bold;

            return btnObj;
        }

        private static GameObject CreateCandyIconButton(Transform parent, string name, string icon, Color bgColor, float size)
        {
            var btnObj = CreateCandyButton(parent, name, icon, bgColor, (int)(size * 0.5f), size, size);
            return btnObj;
        }

        private static GameObject CreateCandyIcon(Transform parent, string name, string icon, Color bgColor, float size)
        {
            var iconObj = new GameObject(name);
            iconObj.transform.SetParent(parent, false);

            var rect = iconObj.AddComponent<RectTransform>();
            rect.sizeDelta = new Vector2(size, size);

            var image = iconObj.AddComponent<Image>();
            image.color = bgColor;

            var outline = iconObj.AddComponent<Outline>();
            outline.effectColor = new Color(bgColor.r * 0.7f, bgColor.g * 0.7f, bgColor.b * 0.7f);
            outline.effectDistance = new Vector2(3, -3);

            var textObj = new GameObject("Text");
            textObj.transform.SetParent(iconObj.transform, false);
            var textRect = textObj.AddComponent<RectTransform>();
            textRect.anchorMin = Vector2.zero;
            textRect.anchorMax = Vector2.one;
            textRect.sizeDelta = Vector2.zero;

            var tmp = textObj.AddComponent<TextMeshProUGUI>();
            tmp.text = icon;
            tmp.fontSize = (int)(size * 0.5f);
            tmp.alignment = TextAlignmentOptions.Center;

            return iconObj;
        }

        private static GameObject CreateCandyTabButton(Transform parent, string name, string icon, string label, bool isActive)
        {
            var btnObj = new GameObject(name);
            btnObj.transform.SetParent(parent, false);

            var rect = btnObj.AddComponent<RectTransform>();
            rect.sizeDelta = new Vector2(100, 95);

            var image = btnObj.AddComponent<Image>();
            image.color = isActive ? CandyColors.purple : new Color(0, 0, 0, 0);

            var button = btnObj.AddComponent<Button>();
            button.targetGraphic = image;

            // 아이콘
            var iconObj = new GameObject("Icon");
            iconObj.transform.SetParent(btnObj.transform, false);
            var iconRect = iconObj.AddComponent<RectTransform>();
            iconRect.anchorMin = new Vector2(0.5f, 0.65f);
            iconRect.anchorMax = new Vector2(0.5f, 0.65f);
            iconRect.sizeDelta = new Vector2(45, 40);

            var iconTmp = iconObj.AddComponent<TextMeshProUGUI>();
            iconTmp.text = icon;
            iconTmp.fontSize = 30;
            iconTmp.alignment = TextAlignmentOptions.Center;
            iconTmp.color = isActive ? CandyColors.yellow : new Color(0.7f, 0.7f, 0.8f);

            // 라벨
            var labelObj = new GameObject("Label");
            labelObj.transform.SetParent(btnObj.transform, false);
            var labelRect = labelObj.AddComponent<RectTransform>();
            labelRect.anchorMin = new Vector2(0.5f, 0.15f);
            labelRect.anchorMax = new Vector2(0.5f, 0.15f);
            labelRect.sizeDelta = new Vector2(90, 28);

            var labelTmp = labelObj.AddComponent<TextMeshProUGUI>();
            labelTmp.text = label;
            labelTmp.fontSize = 16;
            labelTmp.alignment = TextAlignmentOptions.Center;
            labelTmp.color = isActive ? CandyColors.yellow : new Color(0.7f, 0.7f, 0.8f);
            labelTmp.fontStyle = FontStyles.Bold;

            return btnObj;
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

        private static GameObject CreateText(Transform parent, string name, string text, int fontSize)
        {
            var textObj = new GameObject(name);
            textObj.transform.SetParent(parent, false);
            textObj.AddComponent<RectTransform>();

            var tmp = textObj.AddComponent<TextMeshProUGUI>();
            tmp.text = text;
            tmp.fontSize = fontSize;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = Color.white;

            return textObj;
        }

        private static GameObject CreateOutlinedText(Transform parent, string name, string text,
            int fontSize, Color textColor, Color outlineColor)
        {
            var textObj = CreateText(parent, name, text, fontSize);
            var tmp = textObj.GetComponent<TextMeshProUGUI>();
            tmp.color = textColor;
            tmp.fontStyle = FontStyles.Bold;

            // Shadow 효과로 대체 (outline은 Material 필요)
            var shadow = textObj.AddComponent<Shadow>();
            shadow.effectColor = outlineColor;
            shadow.effectDistance = new Vector2(2, -2);

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

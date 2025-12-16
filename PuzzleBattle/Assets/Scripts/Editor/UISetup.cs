using UnityEngine;
using UnityEngine.UI;
using UnityEditor;
using TMPro;
using PuzzleBattle.UI;

namespace PuzzleBattle.Editor
{
    public class UISetup : MonoBehaviour
    {
        [MenuItem("PuzzleBattle/Setup Full UI")]
        public static void SetupFullUI()
        {
            var existingCanvas = Object.FindObjectOfType<Canvas>();
            if (existingCanvas != null)
            {
                DestroyImmediate(existingCanvas.gameObject);
            }

            var canvasObj = CreateCanvas();

            var loginScreen = CreateLoginScreen(canvasObj.transform);
            var mainScreen = CreateMainScreen(canvasObj.transform);
            var gameScreen = CreateGameScreen(canvasObj.transform);
            var resultScreen = CreateResultScreen(canvasObj.transform);

            var screenManager = canvasObj.AddComponent<ScreenManager>();
            var so = new SerializedObject(screenManager);
            so.FindProperty("loginScreen").objectReferenceValue = loginScreen;
            so.FindProperty("mainScreen").objectReferenceValue = mainScreen;
            so.FindProperty("gameScreen").objectReferenceValue = gameScreen;
            so.FindProperty("resultScreen").objectReferenceValue = resultScreen;
            so.ApplyModifiedProperties();

            CreateGameItemPrefab();

            Debug.Log("=== Full UI Setup Complete! ===");
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

        private static GameObject CreateLoginScreen(Transform parent)
        {
            // 그라데이션 배경 효과를 위한 다크 블루
            var screen = CreateFullScreenPanel(parent, "LoginScreen", new Color(0.08f, 0.12f, 0.22f));

            // 상단 장식 원
            var topDecor = CreatePanel(screen.transform, "TopDecor", new Color(0.2f, 0.4f, 0.7f, 0.3f));
            SetRectTransform(topDecor, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0, 100), new Vector2(600, 600));

            // 로고 영역
            var logoArea = CreatePanel(screen.transform, "LogoArea", new Color(0, 0, 0, 0));
            SetRectTransform(logoArea, new Vector2(0.5f, 0.7f), new Vector2(0.5f, 0.7f), Vector2.zero, new Vector2(300, 300));

            // 로고 아이콘 (퍼즐 조각 모양)
            var logoIcon = CreatePanel(logoArea.transform, "LogoIcon", new Color(0.3f, 0.6f, 0.95f));
            SetRectTransform(logoIcon, new Vector2(0.5f, 0.6f), new Vector2(0.5f, 0.6f), Vector2.zero, new Vector2(120, 120));

            var logoIconText = CreateText(logoIcon.transform, "IconText", "🧩", 60);
            SetRectTransform(logoIconText, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);

            // 타이틀
            var title = CreateText(screen.transform, "Title", "PUZZLE BATTLE", 52);
            SetRectTransform(title, new Vector2(0.5f, 0.52f), new Vector2(0.5f, 0.52f), Vector2.zero, new Vector2(700, 80));
            var titleTmp = title.GetComponent<TextMeshProUGUI>();
            titleTmp.fontStyle = FontStyles.Bold;

            // 서브타이틀
            var subtitle = CreateText(screen.transform, "Subtitle", "Daily Puzzle Challenge with Friends", 24);
            SetRectTransform(subtitle, new Vector2(0.5f, 0.45f), new Vector2(0.5f, 0.45f), Vector2.zero, new Vector2(600, 40));
            var subtitleTmp = subtitle.GetComponent<TextMeshProUGUI>();
            subtitleTmp.color = new Color(0.7f, 0.8f, 0.9f);

            // 로그인 버튼 컨테이너
            var btnContainer = CreatePanel(screen.transform, "ButtonContainer", new Color(0, 0, 0, 0));
            SetRectTransform(btnContainer, new Vector2(0.5f, 0.28f), new Vector2(0.5f, 0.28f), Vector2.zero, new Vector2(500, 200));

            // 구글 로그인 버튼
            var googleBtn = CreateStyledButton(btnContainer.transform, "GoogleLoginBtn", "🔵  Continue with Google",
                new Color(0.95f, 0.95f, 0.95f), Color.black, 24);
            SetRectTransform(googleBtn, new Vector2(0.5f, 0.7f), new Vector2(0.5f, 0.7f), Vector2.zero, new Vector2(450, 65));

            // 애플 로그인 버튼
            var appleBtn = CreateStyledButton(btnContainer.transform, "AppleLoginBtn", "🍎  Continue with Apple",
                new Color(0.1f, 0.1f, 0.1f), Color.white, 24);
            SetRectTransform(appleBtn, new Vector2(0.5f, 0.3f), new Vector2(0.5f, 0.3f), Vector2.zero, new Vector2(450, 65));

            // 게스트 로그인
            var guestBtn = CreateText(screen.transform, "GuestLogin", "Play as Guest →", 20);
            SetRectTransform(guestBtn, new Vector2(0.5f, 0.12f), new Vector2(0.5f, 0.12f), Vector2.zero, new Vector2(300, 40));
            var guestTmp = guestBtn.GetComponent<TextMeshProUGUI>();
            guestTmp.color = new Color(0.5f, 0.6f, 0.8f);

            // 게스트 버튼 추가
            var guestBtnComponent = guestBtn.AddComponent<Button>();
            guestBtnComponent.transition = Selectable.Transition.ColorTint;

            // 하단 버전 정보
            var version = CreateText(screen.transform, "Version", "v1.0.0", 16);
            SetRectTransform(version, new Vector2(0.5f, 0.03f), new Vector2(0.5f, 0.03f), Vector2.zero, new Vector2(200, 30));
            version.GetComponent<TextMeshProUGUI>().color = new Color(0.4f, 0.4f, 0.5f);

            // LoginScreen 컴포넌트
            var loginScreen = screen.AddComponent<LoginScreen>();
            var so = new SerializedObject(loginScreen);
            so.FindProperty("loginButton").objectReferenceValue = googleBtn.GetComponent<Button>();
            so.FindProperty("titleText").objectReferenceValue = title.GetComponent<TextMeshProUGUI>();
            so.ApplyModifiedProperties();

            return screen;
        }

        private static GameObject CreateMainScreen(Transform parent)
        {
            var screen = CreateFullScreenPanel(parent, "MainScreen", new Color(0.06f, 0.08f, 0.12f));
            screen.SetActive(false);

            // 헤더
            var header = CreatePanel(screen.transform, "Header", new Color(0.1f, 0.14f, 0.22f));
            SetRectTransform(header, new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -70), new Vector2(0, 140));

            // 프로필 영역
            var profileArea = CreatePanel(header.transform, "ProfileArea", new Color(0, 0, 0, 0));
            SetRectTransform(profileArea, new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(90, 0), new Vector2(300, 80));

            var profileIcon = CreatePanel(profileArea.transform, "ProfileIcon", new Color(0.3f, 0.5f, 0.8f));
            SetRectTransform(profileIcon, new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(30, 0), new Vector2(55, 55));
            var profileIconText = CreateText(profileIcon.transform, "IconText", "👤", 28);
            SetRectTransform(profileIconText, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);

            var welcomeText = CreateText(profileArea.transform, "WelcomeText", "Hello, Player!", 26);
            SetRectTransform(welcomeText, new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(150, 8), new Vector2(200, 35));
            welcomeText.GetComponent<TextMeshProUGUI>().alignment = TextAlignmentOptions.Left;
            welcomeText.GetComponent<TextMeshProUGUI>().fontStyle = FontStyles.Bold;

            var progressText = CreateText(profileArea.transform, "ProgressText", "Today: 0/3 completed", 18);
            SetRectTransform(progressText, new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(150, -18), new Vector2(200, 25));
            progressText.GetComponent<TextMeshProUGUI>().alignment = TextAlignmentOptions.Left;
            progressText.GetComponent<TextMeshProUGUI>().color = new Color(0.6f, 0.7f, 0.8f);

            // 보석 표시
            var gemArea = CreatePanel(header.transform, "GemArea", new Color(0.2f, 0.25f, 0.35f));
            SetRectTransform(gemArea, new Vector2(1, 0.5f), new Vector2(1, 0.5f), new Vector2(-100, 0), new Vector2(140, 45));

            var gemText = CreateText(gemArea.transform, "GemText", "💎 1,250", 20);
            SetRectTransform(gemText, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);

            // 오늘의 게임 섹션
            var todaySection = CreatePanel(screen.transform, "TodayGamesSection", new Color(0, 0, 0, 0));
            SetRectTransform(todaySection, new Vector2(0, 0.2f), new Vector2(1, 0.88f), Vector2.zero, Vector2.zero);

            var sectionHeader = CreatePanel(todaySection.transform, "SectionHeader", new Color(0, 0, 0, 0));
            SetRectTransform(sectionHeader, new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -40), new Vector2(0, 80));

            var sectionTitle = CreateText(sectionHeader.transform, "SectionTitle", "🎮 Today's Puzzles", 28);
            SetRectTransform(sectionTitle, new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(120, 0), new Vector2(350, 45));
            sectionTitle.GetComponent<TextMeshProUGUI>().alignment = TextAlignmentOptions.Left;
            sectionTitle.GetComponent<TextMeshProUGUI>().fontStyle = FontStyles.Bold;

            var dateText = CreateText(sectionHeader.transform, "DateText", System.DateTime.Now.ToString("MMM dd, yyyy"), 18);
            SetRectTransform(dateText, new Vector2(1, 0.5f), new Vector2(1, 0.5f), new Vector2(-100, 0), new Vector2(180, 30));
            dateText.GetComponent<TextMeshProUGUI>().color = new Color(0.5f, 0.6f, 0.7f);

            // 게임 리스트 컨테이너
            var gameListContainer = CreatePanel(todaySection.transform, "GameListContainer", new Color(0, 0, 0, 0));
            SetRectTransform(gameListContainer, new Vector2(0.05f, 0.05f), new Vector2(0.95f, 0.85f), Vector2.zero, Vector2.zero);

            var verticalLayout = gameListContainer.AddComponent<VerticalLayoutGroup>();
            verticalLayout.spacing = 15;
            verticalLayout.childAlignment = TextAnchor.UpperCenter;
            verticalLayout.childControlWidth = true;
            verticalLayout.childControlHeight = false;
            verticalLayout.childForceExpandWidth = true;
            verticalLayout.childForceExpandHeight = false;
            verticalLayout.padding = new RectOffset(10, 10, 10, 10);

            // 하단 탭바
            var tabBar = CreatePanel(screen.transform, "TabBar", new Color(0.08f, 0.1f, 0.16f));
            SetRectTransform(tabBar, new Vector2(0, 0), new Vector2(1, 0), new Vector2(0, 55), new Vector2(0, 110));

            // 탭바 상단 라인
            var tabBarLine = CreatePanel(tabBar.transform, "TopLine", new Color(0.2f, 0.25f, 0.35f));
            SetRectTransform(tabBarLine, new Vector2(0, 1), new Vector2(1, 1), Vector2.zero, new Vector2(0, 2));

            var tabLayout = tabBar.AddComponent<HorizontalLayoutGroup>();
            tabLayout.spacing = 0;
            tabLayout.padding = new RectOffset(15, 15, 8, 8);
            tabLayout.childAlignment = TextAnchor.MiddleCenter;
            tabLayout.childControlWidth = true;
            tabLayout.childControlHeight = true;
            tabLayout.childForceExpandWidth = true;

            var homeTab = CreateTabButtonStyled(tabBar.transform, "HomeTab", "🏠", "Home", true);
            var rankTab = CreateTabButtonStyled(tabBar.transform, "RankingTab", "🏆", "Ranking", false);
            var shopTab = CreateTabButtonStyled(tabBar.transform, "ShopTab", "🛒", "Shop", false);
            var settingsTab = CreateTabButtonStyled(tabBar.transform, "SettingsTab", "⚙️", "Settings", false);

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

            // GameItem 프리팹 연결
            var gameItemPrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Prefabs/UI/GameItem.prefab");
            so.FindProperty("gameItemPrefab").objectReferenceValue = gameItemPrefab;
            so.ApplyModifiedProperties();

            return screen;
        }

        private static GameObject CreateGameScreen(Transform parent)
        {
            var screen = CreateFullScreenPanel(parent, "GameScreen", new Color(0.05f, 0.07f, 0.1f));
            screen.SetActive(false);

            // 헤더
            var header = CreatePanel(screen.transform, "Header", new Color(0.08f, 0.12f, 0.2f));
            SetRectTransform(header, new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -45), new Vector2(0, 90));

            var backBtn = CreateIconButton(header.transform, "BackButton", "←", new Color(0.3f, 0.35f, 0.45f));
            SetRectTransform(backBtn, new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(55, 0), new Vector2(50, 50));

            var gameNameText = CreateText(header.transform, "GameName", "SUDOKU", 28);
            SetRectTransform(gameNameText, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(200, 40));
            gameNameText.GetComponent<TextMeshProUGUI>().fontStyle = FontStyles.Bold;

            // 타이머 영역
            var timerArea = CreatePanel(header.transform, "TimerArea", new Color(0.2f, 0.25f, 0.35f));
            SetRectTransform(timerArea, new Vector2(1, 0.5f), new Vector2(1, 0.5f), new Vector2(-80, 0), new Vector2(110, 45));

            var timerIcon = CreateText(timerArea.transform, "TimerIcon", "⏱️", 18);
            SetRectTransform(timerIcon, new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(20, 0), new Vector2(30, 30));

            var timerText = CreateText(timerArea.transform, "Timer", "05:00", 22);
            SetRectTransform(timerText, new Vector2(1, 0.5f), new Vector2(1, 0.5f), new Vector2(-40, 0), new Vector2(70, 35));
            timerText.GetComponent<TextMeshProUGUI>().fontStyle = FontStyles.Bold;

            // 그리드 영역
            var gridArea = CreatePanel(screen.transform, "GridArea", new Color(0.12f, 0.15f, 0.22f));
            SetRectTransform(gridArea, new Vector2(0.5f, 0.52f), new Vector2(0.5f, 0.52f), Vector2.zero, new Vector2(700, 700));

            var gridContainer = CreatePanel(gridArea.transform, "GridContainer", new Color(0, 0, 0, 0));
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
            var numberPad = CreatePanel(screen.transform, "NumberPad", new Color(0, 0, 0, 0));
            SetRectTransform(numberPad, new Vector2(0.5f, 0.1f), new Vector2(0.5f, 0.1f), Vector2.zero, new Vector2(720, 70));

            var numberPadLayout = numberPad.AddComponent<HorizontalLayoutGroup>();
            numberPadLayout.spacing = 6;
            numberPadLayout.childAlignment = TextAnchor.MiddleCenter;
            numberPadLayout.childControlWidth = true;
            numberPadLayout.childControlHeight = true;
            numberPadLayout.childForceExpandWidth = true;

            // 힌트 버튼
            var hintBtn = CreateStyledButton(screen.transform, "HintButton", "💡 Hint (-10s)",
                new Color(0.85f, 0.6f, 0.2f), Color.white, 20);
            SetRectTransform(hintBtn, new Vector2(0.5f, 0.19f), new Vector2(0.5f, 0.19f), Vector2.zero, new Vector2(180, 50));

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

        private static GameObject CreateResultScreen(Transform parent)
        {
            var screen = CreateFullScreenPanel(parent, "ResultScreen", new Color(0.06f, 0.1f, 0.18f, 0.98f));
            screen.SetActive(false);

            // 성공 아이콘
            var successIcon = CreatePanel(screen.transform, "SuccessIcon", new Color(0.2f, 0.7f, 0.4f));
            SetRectTransform(successIcon, new Vector2(0.5f, 0.75f), new Vector2(0.5f, 0.75f), Vector2.zero, new Vector2(120, 120));
            var successIconText = CreateText(successIcon.transform, "IconText", "✓", 60);
            SetRectTransform(successIconText, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            successIconText.GetComponent<TextMeshProUGUI>().fontStyle = FontStyles.Bold;

            var title = CreateText(screen.transform, "Title", "Puzzle Complete!", 42);
            SetRectTransform(title, new Vector2(0.5f, 0.62f), new Vector2(0.5f, 0.62f), Vector2.zero, new Vector2(600, 60));
            title.GetComponent<TextMeshProUGUI>().fontStyle = FontStyles.Bold;

            // 스코어 카드
            var scoreCard = CreatePanel(screen.transform, "ScoreCard", new Color(0.12f, 0.16f, 0.25f));
            SetRectTransform(scoreCard, new Vector2(0.5f, 0.45f), new Vector2(0.5f, 0.45f), Vector2.zero, new Vector2(400, 180));

            var scoreLabel = CreateText(scoreCard.transform, "ScoreLabel", "SCORE", 18);
            SetRectTransform(scoreLabel, new Vector2(0.5f, 0.8f), new Vector2(0.5f, 0.8f), Vector2.zero, new Vector2(200, 30));
            scoreLabel.GetComponent<TextMeshProUGUI>().color = new Color(0.6f, 0.7f, 0.8f);

            var scoreText = CreateText(scoreCard.transform, "ScoreText", "1,250", 48);
            SetRectTransform(scoreText, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(300, 70));
            scoreText.GetComponent<TextMeshProUGUI>().fontStyle = FontStyles.Bold;
            scoreText.GetComponent<TextMeshProUGUI>().color = new Color(1f, 0.85f, 0.3f);

            var timeText = CreateText(scoreCard.transform, "TimeText", "⏱️ Time: 03:45", 22);
            SetRectTransform(timeText, new Vector2(0.5f, 0.18f), new Vector2(0.5f, 0.18f), Vector2.zero, new Vector2(250, 35));
            timeText.GetComponent<TextMeshProUGUI>().color = new Color(0.7f, 0.8f, 0.9f);

            // 보너스 정보
            var bonusText = CreateText(screen.transform, "BonusText", "🎁 +50 Gems Earned!", 24);
            SetRectTransform(bonusText, new Vector2(0.5f, 0.3f), new Vector2(0.5f, 0.3f), Vector2.zero, new Vector2(350, 40));
            bonusText.GetComponent<TextMeshProUGUI>().color = new Color(0.4f, 0.8f, 1f);

            var continueBtn = CreateStyledButton(screen.transform, "ContinueButton", "Continue →",
                new Color(0.25f, 0.65f, 0.4f), Color.white, 26);
            SetRectTransform(continueBtn, new Vector2(0.5f, 0.15f), new Vector2(0.5f, 0.15f), Vector2.zero, new Vector2(320, 70));

            continueBtn.GetComponent<Button>().onClick.AddListener(() => {
                ScreenManager.Instance?.GoToMain();
            });

            return screen;
        }

        private static void CreateGameItemPrefab()
        {
            var itemObj = new GameObject("GameItem");

            var rect = itemObj.AddComponent<RectTransform>();
            rect.sizeDelta = new Vector2(800, 120);

            var image = itemObj.AddComponent<Image>();
            image.color = new Color(0.14f, 0.18f, 0.28f);

            // 왼쪽 색상 바 (퍼즐 타입별 색상)
            var colorBar = new GameObject("ColorBar");
            colorBar.transform.SetParent(itemObj.transform, false);
            var colorBarRect = colorBar.AddComponent<RectTransform>();
            colorBarRect.anchorMin = new Vector2(0, 0);
            colorBarRect.anchorMax = new Vector2(0, 1);
            colorBarRect.sizeDelta = new Vector2(6, 0);
            colorBarRect.anchoredPosition = new Vector2(3, 0);
            var colorBarImage = colorBar.AddComponent<Image>();
            colorBarImage.color = new Color(0.3f, 0.6f, 0.95f);

            // 게임 아이콘 (둥근 배경)
            var iconObj = new GameObject("Icon");
            iconObj.transform.SetParent(itemObj.transform, false);
            var iconRect = iconObj.AddComponent<RectTransform>();
            iconRect.anchorMin = new Vector2(0, 0.5f);
            iconRect.anchorMax = new Vector2(0, 0.5f);
            iconRect.sizeDelta = new Vector2(75, 75);
            iconRect.anchoredPosition = new Vector2(60, 0);
            var iconImage = iconObj.AddComponent<Image>();
            iconImage.color = new Color(0.25f, 0.45f, 0.75f);

            var iconText = CreateText(iconObj.transform, "IconText", "🔢", 36);
            SetRectTransform(iconText, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);

            // 텍스트 영역
            var textArea = new GameObject("TextArea");
            textArea.transform.SetParent(itemObj.transform, false);
            var textAreaRect = textArea.AddComponent<RectTransform>();
            textAreaRect.anchorMin = new Vector2(0, 0);
            textAreaRect.anchorMax = new Vector2(1, 1);
            textAreaRect.offsetMin = new Vector2(145, 18);
            textAreaRect.offsetMax = new Vector2(-110, -18);

            var nameText = CreateText(textArea.transform, "GameName", "Sudoku", 28);
            SetRectTransform(nameText, new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, -20), new Vector2(280, 40));
            nameText.GetComponent<TextMeshProUGUI>().alignment = TextAlignmentOptions.Left;
            nameText.GetComponent<TextMeshProUGUI>().fontStyle = FontStyles.Bold;

            var statusText = CreateText(textArea.transform, "Status", "Tap to Play!", 17);
            SetRectTransform(statusText, new Vector2(0, 0), new Vector2(0, 0), new Vector2(0, 20), new Vector2(280, 28));
            statusText.GetComponent<TextMeshProUGUI>().alignment = TextAlignmentOptions.Left;
            statusText.GetComponent<TextMeshProUGUI>().color = new Color(0.5f, 0.8f, 0.55f);

            // 플레이 버튼 (더 큰 원형)
            var playBtn = CreateIconButton(itemObj.transform, "PlayButton", "▶", new Color(0.25f, 0.7f, 0.4f));
            var playBtnRect = playBtn.GetComponent<RectTransform>();
            playBtnRect.anchorMin = new Vector2(1, 0.5f);
            playBtnRect.anchorMax = new Vector2(1, 0.5f);
            playBtnRect.sizeDelta = new Vector2(60, 60);
            playBtnRect.anchoredPosition = new Vector2(-50, 0);

            // 컴포넌트 추가
            var gameItemUI = itemObj.AddComponent<GameItemUI>();
            var so = new SerializedObject(gameItemUI);
            so.FindProperty("backgroundImage").objectReferenceValue = image;
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

            Debug.Log("GameItem prefab created with puzzle-specific styling");
        }

        #region Helper Methods

        private static GameObject CreateFullScreenPanel(Transform parent, string name, Color color)
        {
            var panel = new GameObject(name);
            panel.transform.SetParent(parent, false);

            var rect = panel.AddComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.sizeDelta = Vector2.zero;

            var image = panel.AddComponent<Image>();
            image.color = color;

            return panel;
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

        private static GameObject CreateStyledButton(Transform parent, string name, string text, Color bgColor, Color textColor, int fontSize)
        {
            var btnObj = new GameObject(name);
            btnObj.transform.SetParent(parent, false);
            btnObj.AddComponent<RectTransform>();

            var image = btnObj.AddComponent<Image>();
            image.color = bgColor;

            var button = btnObj.AddComponent<Button>();
            button.targetGraphic = image;

            // 버튼 색상 전환 설정
            var colors = button.colors;
            colors.highlightedColor = new Color(bgColor.r * 1.1f, bgColor.g * 1.1f, bgColor.b * 1.1f);
            colors.pressedColor = new Color(bgColor.r * 0.9f, bgColor.g * 0.9f, bgColor.b * 0.9f);
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
            tmp.color = textColor;
            tmp.fontStyle = FontStyles.Bold;

            return btnObj;
        }

        private static GameObject CreateIconButton(Transform parent, string name, string icon, Color bgColor)
        {
            var btnObj = new GameObject(name);
            btnObj.transform.SetParent(parent, false);
            btnObj.AddComponent<RectTransform>();

            var image = btnObj.AddComponent<Image>();
            image.color = bgColor;

            var button = btnObj.AddComponent<Button>();
            button.targetGraphic = image;

            var textObj = new GameObject("Text");
            textObj.transform.SetParent(btnObj.transform, false);
            var textRect = textObj.AddComponent<RectTransform>();
            textRect.anchorMin = Vector2.zero;
            textRect.anchorMax = Vector2.one;
            textRect.sizeDelta = Vector2.zero;

            var tmp = textObj.AddComponent<TextMeshProUGUI>();
            tmp.text = icon;
            tmp.fontSize = 28;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = Color.white;

            return btnObj;
        }

        private static GameObject CreateTabButtonStyled(Transform parent, string name, string icon, string label, bool isActive)
        {
            var btnObj = new GameObject(name);
            btnObj.transform.SetParent(parent, false);

            var rect = btnObj.AddComponent<RectTransform>();
            rect.sizeDelta = new Vector2(100, 90);

            var image = btnObj.AddComponent<Image>();
            image.color = isActive ? new Color(0.15f, 0.2f, 0.32f) : new Color(0, 0, 0, 0);

            var button = btnObj.AddComponent<Button>();
            button.targetGraphic = image;

            // 아이콘
            var iconObj = new GameObject("Icon");
            iconObj.transform.SetParent(btnObj.transform, false);
            var iconRect = iconObj.AddComponent<RectTransform>();
            iconRect.anchorMin = new Vector2(0.5f, 0.65f);
            iconRect.anchorMax = new Vector2(0.5f, 0.65f);
            iconRect.sizeDelta = new Vector2(40, 35);

            var iconTmp = iconObj.AddComponent<TextMeshProUGUI>();
            iconTmp.text = icon;
            iconTmp.fontSize = 26;
            iconTmp.alignment = TextAlignmentOptions.Center;
            iconTmp.color = isActive ? new Color(0.4f, 0.7f, 1f) : new Color(0.5f, 0.55f, 0.65f);

            // 라벨
            var labelObj = new GameObject("Label");
            labelObj.transform.SetParent(btnObj.transform, false);
            var labelRect = labelObj.AddComponent<RectTransform>();
            labelRect.anchorMin = new Vector2(0.5f, 0.15f);
            labelRect.anchorMax = new Vector2(0.5f, 0.15f);
            labelRect.sizeDelta = new Vector2(80, 25);

            var labelTmp = labelObj.AddComponent<TextMeshProUGUI>();
            labelTmp.text = label;
            labelTmp.fontSize = 14;
            labelTmp.alignment = TextAlignmentOptions.Center;
            labelTmp.color = isActive ? new Color(0.4f, 0.7f, 1f) : new Color(0.5f, 0.55f, 0.65f);

            return btnObj;
        }

        private static void SetRectTransform(GameObject obj, Vector2 anchorMin, Vector2 anchorMax, Vector2 anchoredPos, Vector2 sizeDelta)
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

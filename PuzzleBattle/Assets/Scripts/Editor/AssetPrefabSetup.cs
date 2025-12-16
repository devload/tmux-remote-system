using UnityEngine;
using UnityEngine.UI;
using UnityEditor;
using TMPro;
using PuzzleBattle.UI;

namespace PuzzleBattle.Editor
{
    /// <summary>
    /// 구매한 에셋의 프리팹을 직접 활용하는 UI 셋업
    /// </summary>
    public class AssetPrefabSetup : MonoBehaviour
    {
        private const string ASSET_PATH = "Assets/Casual GUI Mobile game UI pack/";
        private const string PREFAB_PATH = ASSET_PATH + "Prefabs/";
        private const string WINDOW_PATH = PREFAB_PATH + "Windows/";
        private const string BUTTON_PATH = PREFAB_PATH + "Buttons/";
        private const string ELEMENT_PATH = PREFAB_PATH + "Elements/";

        [MenuItem("PuzzleBattle/Setup with Asset Prefabs")]
        public static void SetupWithAssetPrefabs()
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

            // 캔버스 생성
            var canvasObj = CreateCanvas();

            // 에셋 프리팹 기반 화면 생성
            var loginScreen = CreateLoginScreenFromAsset(canvasObj.transform);
            var mainScreen = CreateMainScreenFromAsset(canvasObj.transform);
            var gameScreen = CreateGameScreenFromAsset(canvasObj.transform);
            var resultScreen = CreateResultScreenFromAsset(canvasObj.transform);

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
            CreateGameItemPrefabFromAsset();
            CreateCellPrefabFromAsset();
            CreateNumberButtonPrefabFromAsset();

            Debug.Log("=== Asset Prefab Setup Complete! ===");
            Debug.Log("씬을 저장(Ctrl+S)한 후 Play 버튼을 눌러 테스트하세요.");
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

        private static GameObject CreateLoginScreenFromAsset(Transform parent)
        {
            // MainMenuWindow 프리팹 로드 및 인스턴스화
            var menuPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(WINDOW_PATH + "MainMenuWindow.prefab");

            GameObject screen;
            if (menuPrefab != null)
            {
                screen = (GameObject)PrefabUtility.InstantiatePrefab(menuPrefab, parent);
                screen.name = "LoginScreen";

                // 기존 버튼들 찾아서 수정
                ModifyLoginScreen(screen);
            }
            else
            {
                // 폴백: 기본 생성
                screen = CreateFallbackLoginScreen(parent);
            }

            // LoginScreen 컴포넌트 추가
            var loginScreen = screen.AddComponent<LoginScreen>();

            // PLAY 버튼 찾기 또는 생성
            var playButton = FindOrCreatePlayButton(screen);
            var titleText = FindOrCreateTitleText(screen);

            var so = new SerializedObject(loginScreen);
            so.FindProperty("loginButton").objectReferenceValue = playButton;
            so.FindProperty("titleText").objectReferenceValue = titleText;
            so.ApplyModifiedProperties();

            return screen;
        }

        private static void ModifyLoginScreen(GameObject screen)
        {
            // MainMenuWindow의 텍스트들을 우리 게임에 맞게 수정
            var allTexts = screen.GetComponentsInChildren<TextMeshProUGUI>(true);
            foreach (var text in allTexts)
            {
                // 타이틀 텍스트 찾기
                if (text.fontSize >= 40 || text.name.ToLower().Contains("title"))
                {
                    text.text = "PUZZLE\nBATTLE";
                }
            }
        }

        private static Button FindOrCreatePlayButton(GameObject screen)
        {
            // 기존 버튼 중 가장 큰 버튼 찾기 (보통 PLAY 버튼)
            var buttons = screen.GetComponentsInChildren<Button>(true);
            Button largestButton = null;
            float maxSize = 0;

            foreach (var btn in buttons)
            {
                var rect = btn.GetComponent<RectTransform>();
                if (rect != null)
                {
                    float size = rect.sizeDelta.x * rect.sizeDelta.y;
                    if (size > maxSize)
                    {
                        maxSize = size;
                        largestButton = btn;
                    }
                }
            }

            if (largestButton != null)
            {
                // 버튼 텍스트 변경
                var btnText = largestButton.GetComponentInChildren<TextMeshProUGUI>();
                if (btnText != null)
                {
                    btnText.text = "PLAY";
                }
                return largestButton;
            }

            // 버튼이 없으면 에셋의 버튼 프리팹 사용
            return CreatePlayButtonFromAsset(screen.transform);
        }

        private static Button CreatePlayButtonFromAsset(Transform parent)
        {
            var btnPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(BUTTON_PATH + "Button_Big_Green.prefab");

            GameObject btnObj;
            if (btnPrefab != null)
            {
                btnObj = (GameObject)PrefabUtility.InstantiatePrefab(btnPrefab, parent);
            }
            else
            {
                btnObj = new GameObject("PlayButton");
                btnObj.transform.SetParent(parent, false);
                var img = btnObj.AddComponent<Image>();
                img.color = new Color(0.4f, 0.8f, 0.4f);
                btnObj.AddComponent<Button>();
            }

            btnObj.name = "PlayButton";
            var rect = btnObj.GetComponent<RectTransform>();
            rect.anchorMin = new Vector2(0.5f, 0.3f);
            rect.anchorMax = new Vector2(0.5f, 0.3f);
            rect.anchoredPosition = Vector2.zero;
            rect.sizeDelta = new Vector2(350, 90);

            var text = btnObj.GetComponentInChildren<TextMeshProUGUI>();
            if (text != null)
            {
                text.text = "PLAY";
            }

            return btnObj.GetComponent<Button>();
        }

        private static TextMeshProUGUI FindOrCreateTitleText(GameObject screen)
        {
            var texts = screen.GetComponentsInChildren<TextMeshProUGUI>(true);
            foreach (var text in texts)
            {
                if (text.fontSize >= 35)
                {
                    return text;
                }
            }

            // 없으면 생성
            var titleObj = new GameObject("Title");
            titleObj.transform.SetParent(screen.transform, false);
            var rect = titleObj.AddComponent<RectTransform>();
            rect.anchorMin = new Vector2(0.5f, 0.7f);
            rect.anchorMax = new Vector2(0.5f, 0.7f);
            rect.sizeDelta = new Vector2(500, 150);

            var tmp = titleObj.AddComponent<TextMeshProUGUI>();
            tmp.text = "PUZZLE\nBATTLE";
            tmp.fontSize = 56;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.fontStyle = FontStyles.Bold;
            tmp.color = Color.white;

            return tmp;
        }

        private static GameObject CreateFallbackLoginScreen(Transform parent)
        {
            var screen = new GameObject("LoginScreen");
            screen.transform.SetParent(parent, false);
            var rect = screen.AddComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.sizeDelta = Vector2.zero;

            var image = screen.AddComponent<Image>();
            image.color = new Color(0.3f, 0.2f, 0.5f);

            return screen;
        }

        #endregion

        #region Main Screen

        private static GameObject CreateMainScreenFromAsset(Transform parent)
        {
            // ChapterLevelsWindow 프리팹 사용 (게임 선택에 적합)
            var levelsPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(WINDOW_PATH + "ChapterLevelsWindow.prefab");

            GameObject screen;
            if (levelsPrefab != null)
            {
                screen = (GameObject)PrefabUtility.InstantiatePrefab(levelsPrefab, parent);
                screen.name = "MainScreen";
                ModifyMainScreen(screen);
            }
            else
            {
                screen = CreateFallbackMainScreen(parent);
            }

            screen.SetActive(false);

            // MainScreen 컴포넌트 추가
            var mainScreen = screen.AddComponent<MainScreen>();

            // 게임 리스트 컨테이너 찾기/생성
            var gameListContainer = FindOrCreateGameListContainer(screen);

            // 탭 버튼들 찾기/생성
            var (homeTab, rankTab, shopTab, settingsTab) = FindOrCreateTabButtons(screen);

            var so = new SerializedObject(mainScreen);
            so.FindProperty("gameListContainer").objectReferenceValue = gameListContainer;
            so.FindProperty("homeTab").objectReferenceValue = homeTab;
            so.FindProperty("rankingTab").objectReferenceValue = rankTab;
            so.FindProperty("shopTab").objectReferenceValue = shopTab;
            so.FindProperty("settingsTab").objectReferenceValue = settingsTab;

            var gameItemPrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Prefabs/UI/GameItem.prefab");
            so.FindProperty("gameItemPrefab").objectReferenceValue = gameItemPrefab;
            so.ApplyModifiedProperties();

            return screen;
        }

        private static void ModifyMainScreen(GameObject screen)
        {
            var texts = screen.GetComponentsInChildren<TextMeshProUGUI>(true);
            foreach (var text in texts)
            {
                if (text.name.ToLower().Contains("title") || text.fontSize >= 30)
                {
                    if (!text.text.Contains("PUZZLE"))
                    {
                        text.text = "TODAY'S PUZZLES";
                    }
                }
            }
        }

        private static Transform FindOrCreateGameListContainer(GameObject screen)
        {
            // Content나 Grid를 포함한 오브젝트 찾기
            var transforms = screen.GetComponentsInChildren<Transform>(true);
            foreach (var t in transforms)
            {
                if (t.name.ToLower().Contains("content") ||
                    t.name.ToLower().Contains("grid") ||
                    t.name.ToLower().Contains("scroll"))
                {
                    // VerticalLayoutGroup 추가
                    if (t.GetComponent<VerticalLayoutGroup>() == null &&
                        t.GetComponent<GridLayoutGroup>() == null)
                    {
                        var layout = t.gameObject.AddComponent<VerticalLayoutGroup>();
                        layout.spacing = 15;
                        layout.childAlignment = TextAnchor.UpperCenter;
                        layout.childControlWidth = true;
                        layout.childControlHeight = false;
                        layout.childForceExpandWidth = true;
                        layout.childForceExpandHeight = false;
                        layout.padding = new RectOffset(10, 10, 10, 10);
                    }
                    return t;
                }
            }

            // 없으면 새로 생성
            var container = new GameObject("GameListContainer");
            container.transform.SetParent(screen.transform, false);
            var rect = container.AddComponent<RectTransform>();
            rect.anchorMin = new Vector2(0.05f, 0.15f);
            rect.anchorMax = new Vector2(0.95f, 0.85f);
            rect.sizeDelta = Vector2.zero;

            var layout2 = container.AddComponent<VerticalLayoutGroup>();
            layout2.spacing = 15;
            layout2.childAlignment = TextAnchor.UpperCenter;
            layout2.childControlWidth = true;
            layout2.childControlHeight = false;
            layout2.childForceExpandWidth = true;
            layout2.childForceExpandHeight = false;

            return container.transform;
        }

        private static (Button, Button, Button, Button) FindOrCreateTabButtons(GameObject screen)
        {
            var buttons = screen.GetComponentsInChildren<Button>(true);

            Button homeTab = null, rankTab = null, shopTab = null, settingsTab = null;
            int btnIndex = 0;

            foreach (var btn in buttons)
            {
                var rect = btn.GetComponent<RectTransform>();
                // 하단에 있는 작은 버튼들 찾기
                if (rect != null && rect.anchoredPosition.y < 0)
                {
                    switch (btnIndex)
                    {
                        case 0: homeTab = btn; break;
                        case 1: rankTab = btn; break;
                        case 2: shopTab = btn; break;
                        case 3: settingsTab = btn; break;
                    }
                    btnIndex++;
                    if (btnIndex >= 4) break;
                }
            }

            // 부족한 버튼은 생성
            if (homeTab == null) homeTab = CreateSimpleButton(screen.transform, "HomeTab");
            if (rankTab == null) rankTab = CreateSimpleButton(screen.transform, "RankTab");
            if (shopTab == null) shopTab = CreateSimpleButton(screen.transform, "ShopTab");
            if (settingsTab == null) settingsTab = CreateSimpleButton(screen.transform, "SettingsTab");

            return (homeTab, rankTab, shopTab, settingsTab);
        }

        private static Button CreateSimpleButton(Transform parent, string name)
        {
            var btnObj = new GameObject(name);
            btnObj.transform.SetParent(parent, false);
            var rect = btnObj.AddComponent<RectTransform>();
            rect.sizeDelta = new Vector2(80, 80);

            var image = btnObj.AddComponent<Image>();
            image.color = new Color(0.3f, 0.3f, 0.5f, 0.5f);

            return btnObj.AddComponent<Button>();
        }

        private static GameObject CreateFallbackMainScreen(Transform parent)
        {
            var screen = new GameObject("MainScreen");
            screen.transform.SetParent(parent, false);
            var rect = screen.AddComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.sizeDelta = Vector2.zero;

            var image = screen.AddComponent<Image>();
            image.color = new Color(0.2f, 0.3f, 0.5f);

            return screen;
        }

        #endregion

        #region Game Screen

        private static GameObject CreateGameScreenFromAsset(Transform parent)
        {
            // MissionsWindow 프리팹 사용 (게임 플레이에 적합한 레이아웃)
            var missionsPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(WINDOW_PATH + "MissionsWindow.prefab");

            GameObject screen;
            if (missionsPrefab != null)
            {
                screen = (GameObject)PrefabUtility.InstantiatePrefab(missionsPrefab, parent);
                screen.name = "GameScreen";
                ModifyGameScreen(screen);
            }
            else
            {
                screen = CreateFallbackGameScreen(parent);
            }

            screen.SetActive(false);

            // GameScreen 컴포넌트 추가
            var gameScreen = screen.AddComponent<GameScreen>();

            var gridContainer = FindOrCreateGridContainer(screen);
            var numberPad = FindOrCreateNumberPad(screen);
            var backButton = FindOrCreateBackButton(screen);
            var hintButton = FindOrCreateHintButton(screen);
            var gameNameText = FindOrCreateGameNameText(screen);
            var timerText = FindOrCreateTimerText(screen);

            var so = new SerializedObject(gameScreen);
            so.FindProperty("gridContainer").objectReferenceValue = gridContainer;
            so.FindProperty("numberPadContainer").objectReferenceValue = numberPad;
            so.FindProperty("backButton").objectReferenceValue = backButton;
            so.FindProperty("hintButton").objectReferenceValue = hintButton;
            so.FindProperty("gameNameText").objectReferenceValue = gameNameText;
            so.FindProperty("timerText").objectReferenceValue = timerText;

            var cellPrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Prefabs/UI/Cell.prefab");
            var numBtnPrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Prefabs/UI/NumberButton.prefab");
            so.FindProperty("cellPrefab").objectReferenceValue = cellPrefab;
            so.FindProperty("numberButtonPrefab").objectReferenceValue = numBtnPrefab;
            so.ApplyModifiedProperties();

            return screen;
        }

        private static void ModifyGameScreen(GameObject screen)
        {
            // 기존 콘텐츠 정리 및 게임에 맞게 수정
        }

        private static Transform FindOrCreateGridContainer(GameObject screen)
        {
            var container = new GameObject("GridContainer");
            container.transform.SetParent(screen.transform, false);
            var rect = container.AddComponent<RectTransform>();
            rect.anchorMin = new Vector2(0.5f, 0.52f);
            rect.anchorMax = new Vector2(0.5f, 0.52f);
            rect.sizeDelta = new Vector2(660, 660);

            var grid = container.AddComponent<GridLayoutGroup>();
            grid.cellSize = new Vector2(70, 70);
            grid.spacing = new Vector2(3, 3);
            grid.childAlignment = TextAnchor.MiddleCenter;
            grid.constraint = GridLayoutGroup.Constraint.FixedColumnCount;
            grid.constraintCount = 9;

            return container.transform;
        }

        private static Transform FindOrCreateNumberPad(GameObject screen)
        {
            var container = new GameObject("NumberPad");
            container.transform.SetParent(screen.transform, false);
            var rect = container.AddComponent<RectTransform>();
            rect.anchorMin = new Vector2(0.5f, 0.1f);
            rect.anchorMax = new Vector2(0.5f, 0.1f);
            rect.sizeDelta = new Vector2(680, 65);

            var layout = container.AddComponent<HorizontalLayoutGroup>();
            layout.spacing = 5;
            layout.childAlignment = TextAnchor.MiddleCenter;
            layout.childControlWidth = true;
            layout.childControlHeight = true;
            layout.childForceExpandWidth = true;

            return container.transform;
        }

        private static Button FindOrCreateBackButton(GameObject screen)
        {
            var btnPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(BUTTON_PATH + "Button_Little_Back.prefab");

            GameObject btnObj;
            if (btnPrefab != null)
            {
                btnObj = (GameObject)PrefabUtility.InstantiatePrefab(btnPrefab, screen.transform);
            }
            else
            {
                btnObj = new GameObject("BackButton");
                btnObj.transform.SetParent(screen.transform, false);
                var img = btnObj.AddComponent<Image>();
                img.color = new Color(0.9f, 0.3f, 0.3f);
                btnObj.AddComponent<Button>();
            }

            btnObj.name = "BackButton";
            var rect = btnObj.GetComponent<RectTransform>();
            rect.anchorMin = new Vector2(0, 1);
            rect.anchorMax = new Vector2(0, 1);
            rect.anchoredPosition = new Vector2(50, -50);
            rect.sizeDelta = new Vector2(55, 55);

            return btnObj.GetComponent<Button>();
        }

        private static Button FindOrCreateHintButton(GameObject screen)
        {
            var btnPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(BUTTON_PATH + "Button_Little_Green.prefab");

            GameObject btnObj;
            if (btnPrefab != null)
            {
                btnObj = (GameObject)PrefabUtility.InstantiatePrefab(btnPrefab, screen.transform);
            }
            else
            {
                btnObj = new GameObject("HintButton");
                btnObj.transform.SetParent(screen.transform, false);
                var img = btnObj.AddComponent<Image>();
                img.color = new Color(0.9f, 0.6f, 0.2f);
                btnObj.AddComponent<Button>();
            }

            btnObj.name = "HintButton";
            var rect = btnObj.GetComponent<RectTransform>();
            rect.anchorMin = new Vector2(0.5f, 0.02f);
            rect.anchorMax = new Vector2(0.5f, 0.02f);
            rect.anchoredPosition = Vector2.zero;
            rect.sizeDelta = new Vector2(140, 50);

            var text = btnObj.GetComponentInChildren<TextMeshProUGUI>();
            if (text != null) text.text = "HINT";

            return btnObj.GetComponent<Button>();
        }

        private static TextMeshProUGUI FindOrCreateGameNameText(GameObject screen)
        {
            var textObj = new GameObject("GameName");
            textObj.transform.SetParent(screen.transform, false);
            var rect = textObj.AddComponent<RectTransform>();
            rect.anchorMin = new Vector2(0.5f, 1);
            rect.anchorMax = new Vector2(0.5f, 1);
            rect.anchoredPosition = new Vector2(0, -50);
            rect.sizeDelta = new Vector2(250, 50);

            var tmp = textObj.AddComponent<TextMeshProUGUI>();
            tmp.text = "SUDOKU";
            tmp.fontSize = 32;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.fontStyle = FontStyles.Bold;
            tmp.color = Color.white;

            return tmp;
        }

        private static TextMeshProUGUI FindOrCreateTimerText(GameObject screen)
        {
            var textObj = new GameObject("Timer");
            textObj.transform.SetParent(screen.transform, false);
            var rect = textObj.AddComponent<RectTransform>();
            rect.anchorMin = new Vector2(1, 1);
            rect.anchorMax = new Vector2(1, 1);
            rect.anchoredPosition = new Vector2(-80, -50);
            rect.sizeDelta = new Vector2(120, 45);

            var tmp = textObj.AddComponent<TextMeshProUGUI>();
            tmp.text = "05:00";
            tmp.fontSize = 24;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.fontStyle = FontStyles.Bold;
            tmp.color = Color.white;

            return tmp;
        }

        private static GameObject CreateFallbackGameScreen(Transform parent)
        {
            var screen = new GameObject("GameScreen");
            screen.transform.SetParent(parent, false);
            var rect = screen.AddComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.sizeDelta = Vector2.zero;

            var image = screen.AddComponent<Image>();
            image.color = new Color(0.2f, 0.4f, 0.6f);

            return screen;
        }

        #endregion

        #region Result Screen

        private static GameObject CreateResultScreenFromAsset(Transform parent)
        {
            // VictoryWindow 프리팹 사용
            var victoryPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(WINDOW_PATH + "VictoryWindow.prefab");

            GameObject screen;
            if (victoryPrefab != null)
            {
                screen = (GameObject)PrefabUtility.InstantiatePrefab(victoryPrefab, parent);
                screen.name = "ResultScreen";
                ModifyResultScreen(screen);
            }
            else
            {
                screen = CreateFallbackResultScreen(parent);
            }

            screen.SetActive(false);

            // Continue 버튼에 이벤트 연결
            var continueBtn = FindContinueButton(screen);
            if (continueBtn != null)
            {
                // 런타임에 연결됨
            }

            return screen;
        }

        private static void ModifyResultScreen(GameObject screen)
        {
            var texts = screen.GetComponentsInChildren<TextMeshProUGUI>(true);
            foreach (var text in texts)
            {
                if (text.name.ToLower().Contains("title") || text.fontSize >= 40)
                {
                    text.text = "EXCELLENT!";
                }
            }
        }

        private static Button FindContinueButton(GameObject screen)
        {
            var buttons = screen.GetComponentsInChildren<Button>(true);
            foreach (var btn in buttons)
            {
                var text = btn.GetComponentInChildren<TextMeshProUGUI>();
                if (text != null)
                {
                    text.text = "CONTINUE";

                    // 클릭 이벤트는 런타임에 연결
                    btn.onClick.AddListener(() => {
                        ScreenManager.Instance?.GoToMain();
                    });

                    return btn;
                }
            }
            return null;
        }

        private static GameObject CreateFallbackResultScreen(Transform parent)
        {
            var screen = new GameObject("ResultScreen");
            screen.transform.SetParent(parent, false);
            var rect = screen.AddComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.sizeDelta = Vector2.zero;

            var image = screen.AddComponent<Image>();
            image.color = new Color(0.4f, 0.3f, 0.5f);

            return screen;
        }

        #endregion

        #region Prefabs

        private static void CreateGameItemPrefabFromAsset()
        {
            // Level_1 프리팹을 기반으로 GameItem 생성
            var levelPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(ELEMENT_PATH + "Level_1.prefab");

            GameObject itemObj;
            if (levelPrefab != null)
            {
                itemObj = (GameObject)PrefabUtility.InstantiatePrefab(levelPrefab);
                itemObj.name = "GameItem";

                // 필요한 컴포넌트 추가
                var rect = itemObj.GetComponent<RectTransform>();
                if (rect != null) rect.sizeDelta = new Vector2(850, 120);
            }
            else
            {
                itemObj = CreateFallbackGameItem();
            }

            // GameItemUI 컴포넌트 추가
            var gameItemUI = itemObj.AddComponent<GameItemUI>();

            // 필요한 참조 설정
            var bgImage = itemObj.GetComponent<Image>();
            var texts = itemObj.GetComponentsInChildren<TextMeshProUGUI>(true);
            var buttons = itemObj.GetComponentsInChildren<Button>(true);

            TextMeshProUGUI nameText = null, statusText = null, iconText = null;
            Image iconImage = null, colorBar = null;
            Button playButton = null;

            foreach (var text in texts)
            {
                if (nameText == null) { nameText = text; text.text = "Sudoku"; }
                else if (statusText == null) { statusText = text; text.text = "Tap to Play!"; }
                else if (iconText == null) { iconText = text; text.text = "?"; }
            }

            if (buttons.Length > 0) playButton = buttons[0];

            var images = itemObj.GetComponentsInChildren<Image>(true);
            foreach (var img in images)
            {
                if (img.gameObject != itemObj && iconImage == null)
                    iconImage = img;
            }

            var so = new SerializedObject(gameItemUI);
            if (bgImage != null) so.FindProperty("backgroundImage").objectReferenceValue = bgImage;
            if (iconImage != null) so.FindProperty("iconImage").objectReferenceValue = iconImage;
            if (nameText != null) so.FindProperty("gameNameText").objectReferenceValue = nameText;
            if (statusText != null) so.FindProperty("statusText").objectReferenceValue = statusText;
            if (playButton != null) so.FindProperty("playButton").objectReferenceValue = playButton;
            if (iconText != null) so.FindProperty("iconText").objectReferenceValue = iconText;
            so.ApplyModifiedProperties();

            EnsureDirectoryExists("Assets/Prefabs/UI");
            PrefabUtility.SaveAsPrefabAsset(itemObj, "Assets/Prefabs/UI/GameItem.prefab");
            DestroyImmediate(itemObj);

            Debug.Log("GameItem prefab created from asset");
        }

        private static GameObject CreateFallbackGameItem()
        {
            var itemObj = new GameObject("GameItem");
            var rect = itemObj.AddComponent<RectTransform>();
            rect.sizeDelta = new Vector2(850, 120);

            var image = itemObj.AddComponent<Image>();
            image.color = new Color(0.9f, 0.85f, 0.75f);

            var textObj = new GameObject("Text");
            textObj.transform.SetParent(itemObj.transform, false);
            var textRect = textObj.AddComponent<RectTransform>();
            textRect.anchorMin = Vector2.zero;
            textRect.anchorMax = Vector2.one;
            textRect.sizeDelta = Vector2.zero;

            var tmp = textObj.AddComponent<TextMeshProUGUI>();
            tmp.text = "Game";
            tmp.fontSize = 28;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = new Color(0.3f, 0.2f, 0.1f);

            return itemObj;
        }

        private static void CreateCellPrefabFromAsset()
        {
            var cellObj = new GameObject("Cell");
            var rect = cellObj.AddComponent<RectTransform>();
            rect.sizeDelta = new Vector2(70, 70);

            // 에셋의 버튼 스프라이트 로드
            var btnSprite = AssetDatabase.LoadAssetAtPath<Sprite>(
                ASSET_PATH + "ui/PNG/buttons/35_bttn light/bttn-15.png");

            var image = cellObj.AddComponent<Image>();
            if (btnSprite != null)
            {
                image.sprite = btnSprite;
                image.type = Image.Type.Sliced;
            }
            else
            {
                image.color = new Color(0.95f, 0.92f, 0.85f);
            }

            var button = cellObj.AddComponent<Button>();
            button.targetGraphic = image;

            var colors = button.colors;
            colors.highlightedColor = new Color(1f, 0.95f, 0.7f);
            colors.pressedColor = new Color(0.95f, 0.8f, 0.5f);
            colors.selectedColor = new Color(0.8f, 0.9f, 1f);
            button.colors = colors;

            var textObj = new GameObject("Text");
            textObj.transform.SetParent(cellObj.transform, false);
            var textRect = textObj.AddComponent<RectTransform>();
            textRect.anchorMin = Vector2.zero;
            textRect.anchorMax = Vector2.one;
            textRect.sizeDelta = Vector2.zero;

            var tmp = textObj.AddComponent<TextMeshProUGUI>();
            tmp.text = "";
            tmp.fontSize = 32;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = new Color(0.2f, 0.15f, 0.1f);
            tmp.fontStyle = FontStyles.Bold;

            EnsureDirectoryExists("Assets/Prefabs/UI");
            PrefabUtility.SaveAsPrefabAsset(cellObj, "Assets/Prefabs/UI/Cell.prefab");
            DestroyImmediate(cellObj);

            Debug.Log("Cell prefab created");
        }

        private static void CreateNumberButtonPrefabFromAsset()
        {
            // 에셋의 버튼 프리팹 기반
            var btnPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(BUTTON_PATH + "Button_Little_Green.prefab");

            GameObject btnObj;
            if (btnPrefab != null)
            {
                btnObj = (GameObject)PrefabUtility.InstantiatePrefab(btnPrefab);
                btnObj.name = "NumberButton";

                var rect = btnObj.GetComponent<RectTransform>();
                rect.sizeDelta = new Vector2(62, 62);

                var text = btnObj.GetComponentInChildren<TextMeshProUGUI>();
                if (text != null)
                {
                    text.text = "1";
                    text.fontSize = 26;
                }
            }
            else
            {
                btnObj = new GameObject("NumberButton");
                var rect = btnObj.AddComponent<RectTransform>();
                rect.sizeDelta = new Vector2(62, 62);

                var image = btnObj.AddComponent<Image>();
                image.color = new Color(0.35f, 0.6f, 0.9f);

                btnObj.AddComponent<Button>();

                var textObj = new GameObject("Text");
                textObj.transform.SetParent(btnObj.transform, false);
                var textRect = textObj.AddComponent<RectTransform>();
                textRect.anchorMin = Vector2.zero;
                textRect.anchorMax = Vector2.one;
                textRect.sizeDelta = Vector2.zero;

                var tmp = textObj.AddComponent<TextMeshProUGUI>();
                tmp.text = "1";
                tmp.fontSize = 26;
                tmp.alignment = TextAlignmentOptions.Center;
                tmp.color = Color.white;
                tmp.fontStyle = FontStyles.Bold;
            }

            EnsureDirectoryExists("Assets/Prefabs/UI");
            PrefabUtility.SaveAsPrefabAsset(btnObj, "Assets/Prefabs/UI/NumberButton.prefab");
            DestroyImmediate(btnObj);

            Debug.Log("NumberButton prefab created");
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

            new GameObject("GameManager").AddComponent<PuzzleBattle.Core.GameManager>();
            new GameObject("TimerManager").AddComponent<PuzzleBattle.Core.TimerManager>();
            new GameObject("ScoreManager").AddComponent<PuzzleBattle.Core.ScoreManager>();
        }

        #endregion

        #region Helpers

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

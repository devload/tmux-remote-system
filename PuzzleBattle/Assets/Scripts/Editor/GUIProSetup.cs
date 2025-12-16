using UnityEngine;
using UnityEngine.UI;
using UnityEditor;
using TMPro;
using PuzzleBattle.UI;

namespace PuzzleBattle.Editor
{
    /// <summary>
    /// GUI PRO Kit - Casual Game 에셋을 활용한 UI 셋업
    /// </summary>
    public class GUIProSetup : MonoBehaviour
    {
        private const string ASSET_PATH = "Assets/Layer Lab/GUI Pro-CasualGame/";
        private const string PREFAB_PATH = ASSET_PATH + "Prefabs/";
        private const string PANEL_PATH = PREFAB_PATH + "Prefabs_DemoScene_Panels/";
        private const string BUTTON_PATH = PREFAB_PATH + "Prefabs_Component_Buttons/";
        private const string FRAME_PATH = PREFAB_PATH + "Prefabs_Component_Frames/";
        private const string POPUP_PATH = PREFAB_PATH + "Prefabs_Component_Popups/";

        [MenuItem("PuzzleBattle/Setup GUI PRO (Best)")]
        public static void SetupGUIPro()
        {
            // 기존 UI 제거
            CleanupExistingUI();

            // 캔버스 생성
            var canvasObj = CreateCanvas();

            // 에셋 프리팹 기반 화면 생성
            var loginScreen = CreateLoginScreen(canvasObj.transform);
            var mainScreen = CreateMainScreen(canvasObj.transform);
            var gameScreen = CreateGameScreen(canvasObj.transform);
            var resultScreen = CreateResultScreen(canvasObj.transform);

            // ScreenManager 생성 및 연결
            SetupScreenManager(loginScreen, mainScreen, gameScreen, resultScreen);

            // 게임 매니저들 생성
            CreateManagers();

            // 프리팹 생성
            CreateGameItemPrefab();
            CreateCellPrefab();
            CreateNumberButtonPrefab();

            Debug.Log("=== GUI PRO Setup Complete! ===");
            Debug.Log("씬을 저장(Ctrl+S)한 후 Play 버튼을 눌러 테스트하세요.");
        }

        private static void CleanupExistingUI()
        {
            var existingCanvas = Object.FindObjectOfType<Canvas>();
            if (existingCanvas != null)
                DestroyImmediate(existingCanvas.gameObject);

            var existingScreenManager = Object.FindObjectOfType<ScreenManager>();
            if (existingScreenManager != null)
                DestroyImmediate(existingScreenManager.gameObject);
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
            // Title.prefab 로드
            var titlePrefab = AssetDatabase.LoadAssetAtPath<GameObject>(PANEL_PATH + "Title.prefab");

            GameObject screen;
            if (titlePrefab != null)
            {
                screen = (GameObject)PrefabUtility.InstantiatePrefab(titlePrefab, parent);
                screen.name = "LoginScreen";

                // 타이틀 텍스트 수정
                ModifyTitleTexts(screen);
            }
            else
            {
                screen = CreateFallbackScreen(parent, "LoginScreen", new Color(0.2f, 0.3f, 0.5f));
            }

            // LoginScreen 컴포넌트 추가
            var loginComp = screen.AddComponent<LoginScreen>();

            // Play 버튼 찾기
            var playButton = FindButtonByKeywords(screen, "play", "start", "tap", "touch");
            var titleText = FindLargestText(screen);

            var so = new SerializedObject(loginComp);
            so.FindProperty("loginButton").objectReferenceValue = playButton;
            so.FindProperty("titleText").objectReferenceValue = titleText;
            so.ApplyModifiedProperties();

            return screen;
        }

        private static void ModifyTitleTexts(GameObject screen)
        {
            var texts = screen.GetComponentsInChildren<TextMeshProUGUI>(true);
            foreach (var text in texts)
            {
                string lower = text.text.ToLower();
                if (lower.Contains("title") || lower.Contains("game") || text.fontSize >= 60)
                {
                    text.text = "PUZZLE\nBATTLE";
                }
                else if (lower.Contains("tap") || lower.Contains("touch") || lower.Contains("start"))
                {
                    text.text = "TAP TO START";
                }
            }
        }

        #endregion

        #region Main Screen (Stage Select Style)

        private static GameObject CreateMainScreen(Transform parent)
        {
            // Stage_Select_Type1.prefab 로드 - 카드 스와이프 형태의 스테이지 선택
            var stageSelectPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(PANEL_PATH + "Stage_Select_Type1.prefab");

            GameObject screen;
            if (stageSelectPrefab != null)
            {
                screen = (GameObject)PrefabUtility.InstantiatePrefab(stageSelectPrefab, parent);
                screen.name = "MainScreen";

                // 스테이지 선택 화면을 퍼즐 게임용으로 수정
                ModifyStageSelectScreen(screen);
            }
            else
            {
                // 폴백: Lobby 시도
                var lobbyPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(PANEL_PATH + "Lobby.prefab");
                if (lobbyPrefab != null)
                {
                    screen = (GameObject)PrefabUtility.InstantiatePrefab(lobbyPrefab, parent);
                    screen.name = "MainScreen";
                }
                else
                {
                    screen = CreateFallbackScreen(parent, "MainScreen", new Color(0.15f, 0.25f, 0.4f));
                }
            }

            screen.SetActive(false);

            // StageSelectScreen 컴포넌트 추가 (새로운 컴포넌트)
            var stageComp = screen.AddComponent<StageSelectScreen>();

            // 스테이지 카드들 찾기
            var stageCards = FindStageCards(screen);
            var backButton = FindButtonByKeywords(screen, "back", "close", "return");
            var titleText = FindTextByKeywords(screen, "stage", "title", "header");

            var so = new SerializedObject(stageComp);

            // 스테이지 카드 배열 설정
            var stageCardsProp = so.FindProperty("stageCards");
            if (stageCardsProp != null)
            {
                stageCardsProp.arraySize = stageCards.Count;
                for (int i = 0; i < stageCards.Count; i++)
                {
                    stageCardsProp.GetArrayElementAtIndex(i).objectReferenceValue = stageCards[i];
                }
            }

            so.FindProperty("backButton").objectReferenceValue = backButton;
            so.FindProperty("screenTitleText").objectReferenceValue = titleText;
            so.ApplyModifiedProperties();

            return screen;
        }

        private static void ModifyStageSelectScreen(GameObject screen)
        {
            // 타이틀 변경
            var texts = screen.GetComponentsInChildren<TextMeshProUGUI>(true);
            foreach (var text in texts)
            {
                string lower = text.text.ToLower();
                if (lower.Contains("stage") || text.fontSize >= 40)
                {
                    text.text = "Today's Puzzles";
                }
            }

            // 스테이지 카드들의 텍스트 변경
            var cards = FindStageCards(screen);
            string[] puzzleNames = { "Number Master", "Flow Connect", "Shadow Puzzle", "Island Builder" };
            string[] puzzleDescs = { "Sudoku", "Streams", "Hitori", "Nurikabe" };

            for (int i = 0; i < cards.Count && i < puzzleNames.Length; i++)
            {
                var cardTexts = cards[i].GetComponentsInChildren<TextMeshProUGUI>(true);
                foreach (var text in cardTexts)
                {
                    // 카드 제목 (큰 텍스트)
                    if (text.fontSize >= 24 || text.name.ToLower().Contains("title") || text.name.ToLower().Contains("name"))
                    {
                        text.text = puzzleNames[i];
                    }
                    // 부제목/설명
                    else if (text.name.ToLower().Contains("sub") || text.name.ToLower().Contains("desc"))
                    {
                        text.text = puzzleDescs[i];
                    }
                }
            }
        }

        private static List<GameObject> FindStageCards(GameObject screen)
        {
            var cards = new List<GameObject>();
            var transforms = screen.GetComponentsInChildren<Transform>(true);

            foreach (var t in transforms)
            {
                string name = t.name.ToLower();
                // 스테이지 카드, 아이템, 버튼 등을 찾음
                if (name.Contains("stage") || name.Contains("card") || name.Contains("item") || name.Contains("slot"))
                {
                    // Button 컴포넌트가 있거나 클릭 가능한 요소
                    var btn = t.GetComponent<Button>();
                    if (btn != null && t.parent != null)
                    {
                        // 부모가 Content나 Container인 경우 카드로 인식
                        string parentName = t.parent.name.ToLower();
                        if (parentName.Contains("content") || parentName.Contains("container") ||
                            parentName.Contains("scroll") || parentName.Contains("list"))
                        {
                            cards.Add(t.gameObject);
                        }
                    }
                }
            }

            // 카드를 못 찾았으면 이미지가 있는 클릭 가능한 요소 찾기
            if (cards.Count == 0)
            {
                var buttons = screen.GetComponentsInChildren<Button>(true);
                foreach (var btn in buttons)
                {
                    var img = btn.GetComponent<Image>();
                    if (img != null && img.sprite != null)
                    {
                        var rect = btn.GetComponent<RectTransform>();
                        // 일정 크기 이상의 버튼만 카드로 인식
                        if (rect != null && rect.sizeDelta.x >= 100 && rect.sizeDelta.y >= 100)
                        {
                            cards.Add(btn.gameObject);
                        }
                    }
                }
            }

            Debug.Log($"Found {cards.Count} stage cards");
            return cards;
        }

        private static TextMeshProUGUI FindTextByKeywords(GameObject screen, params string[] keywords)
        {
            var texts = screen.GetComponentsInChildren<TextMeshProUGUI>(true);

            foreach (var text in texts)
            {
                string name = text.name.ToLower();
                string content = text.text.ToLower();

                foreach (var keyword in keywords)
                {
                    if (name.Contains(keyword) || content.Contains(keyword))
                        return text;
                }
            }

            // 키워드 못찾으면 가장 큰 텍스트 반환
            return FindLargestText(screen);
        }

        #endregion

        #region Game Screen

        private static GameObject CreateGameScreen(Transform parent)
        {
            // Play_Type1 또는 Play_TypeText 사용
            var playPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(PANEL_PATH + "Play_Type1.prefab");
            if (playPrefab == null)
                playPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(PANEL_PATH + "Play_TypeText.prefab");

            GameObject screen;
            if (playPrefab != null)
            {
                screen = (GameObject)PrefabUtility.InstantiatePrefab(playPrefab, parent);
                screen.name = "GameScreen";
            }
            else
            {
                screen = CreateFallbackScreen(parent, "GameScreen", new Color(0.1f, 0.2f, 0.35f));
            }

            screen.SetActive(false);

            // 게임 컴포넌트 추가
            var gameComp = screen.AddComponent<GameScreen>();

            // 필요한 요소들 찾기/생성
            var gridContainer = FindOrCreateGridContainer(screen);
            var numberPad = FindOrCreateNumberPad(screen);
            var backButton = FindOrCreateBackButton(screen);
            var hintButton = FindOrCreateHintButton(screen);
            var gameNameText = FindOrCreateGameNameText(screen);
            var timerText = FindOrCreateTimerText(screen);

            var so = new SerializedObject(gameComp);
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

        private static Transform FindOrCreateGridContainer(GameObject screen)
        {
            var container = new GameObject("GridContainer");
            container.transform.SetParent(screen.transform, false);

            var rect = container.AddComponent<RectTransform>();
            rect.anchorMin = new Vector2(0.5f, 0.5f);
            rect.anchorMax = new Vector2(0.5f, 0.5f);
            rect.sizeDelta = new Vector2(680, 680);
            rect.anchoredPosition = new Vector2(0, 50);

            var grid = container.AddComponent<GridLayoutGroup>();
            grid.cellSize = new Vector2(72, 72);
            grid.spacing = new Vector2(4, 4);
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
            rect.anchorMin = new Vector2(0.5f, 0.08f);
            rect.anchorMax = new Vector2(0.5f, 0.08f);
            rect.sizeDelta = new Vector2(700, 70);
            rect.anchoredPosition = Vector2.zero;

            var layout = container.AddComponent<HorizontalLayoutGroup>();
            layout.spacing = 8;
            layout.childAlignment = TextAnchor.MiddleCenter;
            layout.childControlWidth = true;
            layout.childControlHeight = true;
            layout.childForceExpandWidth = true;

            return container.transform;
        }

        private static Button FindOrCreateBackButton(GameObject screen)
        {
            // 에셋에서 Back 버튼 찾기
            var buttons = screen.GetComponentsInChildren<Button>(true);
            foreach (var btn in buttons)
            {
                if (btn.name.ToLower().Contains("back") || btn.name.ToLower().Contains("close"))
                    return btn;
            }

            // 에셋 버튼 프리팹 로드
            var btnPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(BUTTON_PATH + "Button_Square01_White.prefab");

            GameObject btnObj;
            if (btnPrefab != null)
            {
                btnObj = (GameObject)PrefabUtility.InstantiatePrefab(btnPrefab, screen.transform);
            }
            else
            {
                btnObj = CreateSimpleButton(screen.transform, new Color(0.8f, 0.3f, 0.3f));
            }

            btnObj.name = "BackButton";
            var rect = btnObj.GetComponent<RectTransform>();
            rect.anchorMin = new Vector2(0, 1);
            rect.anchorMax = new Vector2(0, 1);
            rect.anchoredPosition = new Vector2(60, -60);
            rect.sizeDelta = new Vector2(60, 60);

            var text = btnObj.GetComponentInChildren<TextMeshProUGUI>();
            if (text != null) text.text = "<";

            return btnObj.GetComponent<Button>();
        }

        private static Button FindOrCreateHintButton(GameObject screen)
        {
            var btnPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(BUTTON_PATH + "Button01_145_BtnText_Orange.prefab");

            GameObject btnObj;
            if (btnPrefab != null)
            {
                btnObj = (GameObject)PrefabUtility.InstantiatePrefab(btnPrefab, screen.transform);
            }
            else
            {
                btnObj = CreateSimpleButton(screen.transform, new Color(0.9f, 0.6f, 0.2f));
            }

            btnObj.name = "HintButton";
            var rect = btnObj.GetComponent<RectTransform>();
            rect.anchorMin = new Vector2(0.5f, 0.02f);
            rect.anchorMax = new Vector2(0.5f, 0.02f);
            rect.anchoredPosition = Vector2.zero;
            rect.sizeDelta = new Vector2(160, 55);

            var text = btnObj.GetComponentInChildren<TextMeshProUGUI>();
            if (text != null) text.text = "HINT";

            return btnObj.GetComponent<Button>();
        }

        private static TextMeshProUGUI FindOrCreateGameNameText(GameObject screen)
        {
            // 기존 큰 텍스트 찾기
            var texts = screen.GetComponentsInChildren<TextMeshProUGUI>(true);
            foreach (var t in texts)
            {
                if (t.fontSize >= 30)
                {
                    t.text = "SUDOKU";
                    return t;
                }
            }

            var textObj = new GameObject("GameName");
            textObj.transform.SetParent(screen.transform, false);
            var rect = textObj.AddComponent<RectTransform>();
            rect.anchorMin = new Vector2(0.5f, 1);
            rect.anchorMax = new Vector2(0.5f, 1);
            rect.anchoredPosition = new Vector2(0, -60);
            rect.sizeDelta = new Vector2(300, 60);

            var tmp = textObj.AddComponent<TextMeshProUGUI>();
            tmp.text = "SUDOKU";
            tmp.fontSize = 36;
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
            rect.anchoredPosition = new Vector2(-80, -60);
            rect.sizeDelta = new Vector2(120, 50);

            var tmp = textObj.AddComponent<TextMeshProUGUI>();
            tmp.text = "05:00";
            tmp.fontSize = 28;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.fontStyle = FontStyles.Bold;
            tmp.color = Color.white;

            return tmp;
        }

        private static GameObject CreateSimpleButton(Transform parent, Color color)
        {
            var btnObj = new GameObject("Button");
            btnObj.transform.SetParent(parent, false);

            var rect = btnObj.AddComponent<RectTransform>();
            rect.sizeDelta = new Vector2(100, 50);

            var image = btnObj.AddComponent<Image>();
            image.color = color;

            btnObj.AddComponent<Button>();

            var textObj = new GameObject("Text");
            textObj.transform.SetParent(btnObj.transform, false);
            var textRect = textObj.AddComponent<RectTransform>();
            textRect.anchorMin = Vector2.zero;
            textRect.anchorMax = Vector2.one;
            textRect.sizeDelta = Vector2.zero;

            var tmp = textObj.AddComponent<TextMeshProUGUI>();
            tmp.text = "Button";
            tmp.fontSize = 20;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = Color.white;

            return btnObj;
        }

        #endregion

        #region Result Screen

        private static GameObject CreateResultScreen(Transform parent)
        {
            // Play_Result.prefab 로드
            var resultPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(PANEL_PATH + "Play_Result.prefab");

            GameObject screen;
            if (resultPrefab != null)
            {
                screen = (GameObject)PrefabUtility.InstantiatePrefab(resultPrefab, parent);
                screen.name = "ResultScreen";

                ModifyResultScreen(screen);
            }
            else
            {
                screen = CreateFallbackScreen(parent, "ResultScreen", new Color(0.25f, 0.2f, 0.4f));
            }

            screen.SetActive(false);

            // Continue 버튼에 이벤트 연결
            var continueBtn = FindButtonByKeywords(screen, "continue", "next", "ok", "confirm");
            if (continueBtn != null)
            {
                continueBtn.onClick.AddListener(() => {
                    ScreenManager.Instance?.GoToMain();
                });
            }

            return screen;
        }

        private static void ModifyResultScreen(GameObject screen)
        {
            var texts = screen.GetComponentsInChildren<TextMeshProUGUI>(true);
            foreach (var text in texts)
            {
                if (text.fontSize >= 40)
                {
                    text.text = "EXCELLENT!";
                }
            }

            // Continue 버튼 텍스트 변경
            var buttons = screen.GetComponentsInChildren<Button>(true);
            foreach (var btn in buttons)
            {
                var text = btn.GetComponentInChildren<TextMeshProUGUI>();
                if (text != null)
                {
                    string lower = text.text.ToLower();
                    if (lower.Contains("next") || lower.Contains("continue") || lower.Contains("ok"))
                    {
                        text.text = "CONTINUE";
                    }
                }
            }
        }

        #endregion

        #region Helpers

        private static void SetupScreenManager(GameObject login, GameObject main, GameObject game, GameObject result)
        {
            var screenManagerObj = new GameObject("ScreenManager");
            var screenManager = screenManagerObj.AddComponent<ScreenManager>();

            var so = new SerializedObject(screenManager);
            so.FindProperty("loginScreen").objectReferenceValue = login;
            so.FindProperty("mainScreen").objectReferenceValue = main;
            so.FindProperty("gameScreen").objectReferenceValue = game;
            so.FindProperty("resultScreen").objectReferenceValue = result;
            so.ApplyModifiedProperties();
        }

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

        private static Button FindButtonByKeywords(GameObject screen, params string[] keywords)
        {
            var buttons = screen.GetComponentsInChildren<Button>(true);

            foreach (var btn in buttons)
            {
                string name = btn.name.ToLower();
                var text = btn.GetComponentInChildren<TextMeshProUGUI>();
                string textContent = text != null ? text.text.ToLower() : "";

                foreach (var keyword in keywords)
                {
                    if (name.Contains(keyword) || textContent.Contains(keyword))
                        return btn;
                }
            }

            return buttons.Length > 0 ? buttons[0] : null;
        }

        private static TextMeshProUGUI FindLargestText(GameObject screen)
        {
            var texts = screen.GetComponentsInChildren<TextMeshProUGUI>(true);
            TextMeshProUGUI largest = null;
            float maxSize = 0;

            foreach (var text in texts)
            {
                if (text.fontSize > maxSize)
                {
                    maxSize = text.fontSize;
                    largest = text;
                }
            }

            return largest;
        }

        private static GameObject CreateFallbackScreen(Transform parent, string name, Color bgColor)
        {
            var screen = new GameObject(name);
            screen.transform.SetParent(parent, false);

            var rect = screen.AddComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.sizeDelta = Vector2.zero;

            var image = screen.AddComponent<Image>();
            image.color = bgColor;

            return screen;
        }

        #endregion

        #region Prefabs

        private static void CreateGameItemPrefab()
        {
            // GUI PRO Kit 스타일의 화려한 카드 디자인
            GameObject cardObj = new GameObject("PuzzleCard");
            var cardRect = cardObj.AddComponent<RectTransform>();
            cardRect.sizeDelta = new Vector2(980, 200);

            // 메인 카드 배경 (둥근 모서리 느낌)
            var cardBg = cardObj.AddComponent<Image>();
            cardBg.color = new Color(0.35f, 0.65f, 0.95f); // 기본 파란색

            // 카드 내용물 컨테이너
            var contentObj = new GameObject("Content");
            contentObj.transform.SetParent(cardObj.transform, false);
            var contentRect = contentObj.AddComponent<RectTransform>();
            contentRect.anchorMin = Vector2.zero;
            contentRect.anchorMax = Vector2.one;
            contentRect.offsetMin = new Vector2(15, 15);
            contentRect.offsetMax = new Vector2(-15, -15);

            // 아이콘 배경 (원형)
            var iconBg = new GameObject("IconBackground");
            iconBg.transform.SetParent(contentObj.transform, false);
            var iconBgRect = iconBg.AddComponent<RectTransform>();
            iconBgRect.anchorMin = new Vector2(0, 0.5f);
            iconBgRect.anchorMax = new Vector2(0, 0.5f);
            iconBgRect.anchoredPosition = new Vector2(85, 0);
            iconBgRect.sizeDelta = new Vector2(120, 120);
            var iconBgImage = iconBg.AddComponent<Image>();
            iconBgImage.color = new Color(0.25f, 0.5f, 0.85f);

            // 아이콘 텍스트
            var iconTextObj = new GameObject("IconText");
            iconTextObj.transform.SetParent(iconBg.transform, false);
            var iconTextRect = iconTextObj.AddComponent<RectTransform>();
            iconTextRect.anchorMin = Vector2.zero;
            iconTextRect.anchorMax = Vector2.one;
            iconTextRect.sizeDelta = Vector2.zero;
            var iconTmp = iconTextObj.AddComponent<TextMeshProUGUI>();
            iconTmp.text = "9";
            iconTmp.fontSize = 56;
            iconTmp.alignment = TextAlignmentOptions.Center;
            iconTmp.color = Color.white;
            iconTmp.fontStyle = FontStyles.Bold;

            // 게임 타이틀
            var titleObj = new GameObject("Title");
            titleObj.transform.SetParent(contentObj.transform, false);
            var titleRect = titleObj.AddComponent<RectTransform>();
            titleRect.anchorMin = new Vector2(0, 0.5f);
            titleRect.anchorMax = new Vector2(0, 0.5f);
            titleRect.anchoredPosition = new Vector2(280, 35);
            titleRect.sizeDelta = new Vector2(350, 60);
            var titleTmp = titleObj.AddComponent<TextMeshProUGUI>();
            titleTmp.text = "Number Master";
            titleTmp.fontSize = 38;
            titleTmp.alignment = TextAlignmentOptions.Left;
            titleTmp.fontStyle = FontStyles.Bold;
            titleTmp.color = Color.white;

            // 게임 설명
            var subtitleObj = new GameObject("Subtitle");
            subtitleObj.transform.SetParent(contentObj.transform, false);
            var subtitleRect = subtitleObj.AddComponent<RectTransform>();
            subtitleRect.anchorMin = new Vector2(0, 0.5f);
            subtitleRect.anchorMax = new Vector2(0, 0.5f);
            subtitleRect.anchoredPosition = new Vector2(280, -10);
            subtitleRect.sizeDelta = new Vector2(350, 40);
            var subtitleTmp = subtitleObj.AddComponent<TextMeshProUGUI>();
            subtitleTmp.text = "Fill the grid with 1-9!";
            subtitleTmp.fontSize = 22;
            subtitleTmp.alignment = TextAlignmentOptions.Left;
            subtitleTmp.color = new Color(0.9f, 0.95f, 1f, 0.9f);

            // 난이도 별
            var diffObj = new GameObject("Difficulty");
            diffObj.transform.SetParent(contentObj.transform, false);
            var diffRect = diffObj.AddComponent<RectTransform>();
            diffRect.anchorMin = new Vector2(0, 0.5f);
            diffRect.anchorMax = new Vector2(0, 0.5f);
            diffRect.anchoredPosition = new Vector2(280, -45);
            diffRect.sizeDelta = new Vector2(150, 30);
            var diffTmp = diffObj.AddComponent<TextMeshProUGUI>();
            diffTmp.text = "★★☆";
            diffTmp.fontSize = 24;
            diffTmp.alignment = TextAlignmentOptions.Left;
            diffTmp.color = new Color(1f, 0.9f, 0.4f);

            // NEW 뱃지
            var newBadge = new GameObject("NewBadge");
            newBadge.transform.SetParent(cardObj.transform, false);
            var newBadgeRect = newBadge.AddComponent<RectTransform>();
            newBadgeRect.anchorMin = new Vector2(0, 1);
            newBadgeRect.anchorMax = new Vector2(0, 1);
            newBadgeRect.anchoredPosition = new Vector2(40, -10);
            newBadgeRect.sizeDelta = new Vector2(70, 30);
            var newBadgeBg = newBadge.AddComponent<Image>();
            newBadgeBg.color = new Color(1f, 0.3f, 0.3f);
            var newTextObj = new GameObject("Text");
            newTextObj.transform.SetParent(newBadge.transform, false);
            var newTextRect = newTextObj.AddComponent<RectTransform>();
            newTextRect.anchorMin = Vector2.zero;
            newTextRect.anchorMax = Vector2.one;
            newTextRect.sizeDelta = Vector2.zero;
            var newTmp = newTextObj.AddComponent<TextMeshProUGUI>();
            newTmp.text = "NEW";
            newTmp.fontSize = 16;
            newTmp.alignment = TextAlignmentOptions.Center;
            newTmp.fontStyle = FontStyles.Bold;
            newTmp.color = Color.white;
            newBadge.SetActive(false);

            // 완료 체크 뱃지
            var completedBadge = new GameObject("CompletedBadge");
            completedBadge.transform.SetParent(cardObj.transform, false);
            var compRect = completedBadge.AddComponent<RectTransform>();
            compRect.anchorMin = new Vector2(1, 1);
            compRect.anchorMax = new Vector2(1, 1);
            compRect.anchoredPosition = new Vector2(-30, -30);
            compRect.sizeDelta = new Vector2(60, 60);
            var compBg = completedBadge.AddComponent<Image>();
            compBg.color = new Color(0.3f, 0.85f, 0.4f);
            var compTextObj = new GameObject("Text");
            compTextObj.transform.SetParent(completedBadge.transform, false);
            var compTextRect = compTextObj.AddComponent<RectTransform>();
            compTextRect.anchorMin = Vector2.zero;
            compTextRect.anchorMax = Vector2.one;
            compTextRect.sizeDelta = Vector2.zero;
            var compTmp = compTextObj.AddComponent<TextMeshProUGUI>();
            compTmp.text = "✓";
            compTmp.fontSize = 36;
            compTmp.alignment = TextAlignmentOptions.Center;
            compTmp.color = Color.white;
            completedBadge.SetActive(false);

            // 잠금 오버레이
            var lockedOverlay = new GameObject("LockedOverlay");
            lockedOverlay.transform.SetParent(cardObj.transform, false);
            var lockRect = lockedOverlay.AddComponent<RectTransform>();
            lockRect.anchorMin = Vector2.zero;
            lockRect.anchorMax = Vector2.one;
            lockRect.sizeDelta = Vector2.zero;
            var lockBg = lockedOverlay.AddComponent<Image>();
            lockBg.color = new Color(0.1f, 0.1f, 0.15f, 0.7f);
            var lockIconObj = new GameObject("LockIcon");
            lockIconObj.transform.SetParent(lockedOverlay.transform, false);
            var lockIconRect = lockIconObj.AddComponent<RectTransform>();
            lockIconRect.anchorMin = new Vector2(0.5f, 0.5f);
            lockIconRect.anchorMax = new Vector2(0.5f, 0.5f);
            lockIconRect.sizeDelta = new Vector2(80, 80);
            var lockIconTmp = lockIconObj.AddComponent<TextMeshProUGUI>();
            lockIconTmp.text = "🔒";
            lockIconTmp.fontSize = 48;
            lockIconTmp.alignment = TextAlignmentOptions.Center;
            lockedOverlay.SetActive(false);

            // PLAY 버튼
            var playBtnPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(BUTTON_PATH + "Button01_145_BtnText_Green.prefab");
            GameObject playBtn;
            if (playBtnPrefab != null)
            {
                playBtn = (GameObject)PrefabUtility.InstantiatePrefab(playBtnPrefab, contentObj.transform);
            }
            else
            {
                playBtn = new GameObject("PlayButton");
                playBtn.transform.SetParent(contentObj.transform, false);
                var playBtnBg = playBtn.AddComponent<Image>();
                playBtnBg.color = new Color(0.3f, 0.8f, 0.4f);
                playBtn.AddComponent<Button>();

                var playTextObj = new GameObject("Text");
                playTextObj.transform.SetParent(playBtn.transform, false);
                var playTextRect = playTextObj.AddComponent<RectTransform>();
                playTextRect.anchorMin = Vector2.zero;
                playTextRect.anchorMax = Vector2.one;
                playTextRect.sizeDelta = Vector2.zero;
                var playTmp = playTextObj.AddComponent<TextMeshProUGUI>();
                playTmp.text = "PLAY!";
                playTmp.fontSize = 26;
                playTmp.alignment = TextAlignmentOptions.Center;
                playTmp.fontStyle = FontStyles.Bold;
                playTmp.color = Color.white;
            }
            playBtn.name = "PlayButton";
            var playBtnRect = playBtn.GetComponent<RectTransform>();
            playBtnRect.anchorMin = new Vector2(1, 0.5f);
            playBtnRect.anchorMax = new Vector2(1, 0.5f);
            playBtnRect.anchoredPosition = new Vector2(-100, 0);
            playBtnRect.sizeDelta = new Vector2(150, 65);

            var playBtnText = playBtn.GetComponentInChildren<TextMeshProUGUI>();
            if (playBtnText != null) playBtnText.text = "PLAY!";

            // PuzzleCardUI 컴포넌트 추가
            var cardUI = cardObj.AddComponent<PuzzleCardUI>();
            var so = new SerializedObject(cardUI);
            so.FindProperty("cardBackground").objectReferenceValue = cardBg;
            so.FindProperty("iconBackground").objectReferenceValue = iconBgImage;
            so.FindProperty("iconText").objectReferenceValue = iconTmp;
            so.FindProperty("titleText").objectReferenceValue = titleTmp;
            so.FindProperty("subtitleText").objectReferenceValue = subtitleTmp;
            so.FindProperty("difficultyText").objectReferenceValue = diffTmp;
            so.FindProperty("newBadge").objectReferenceValue = newBadge;
            so.FindProperty("completedBadge").objectReferenceValue = completedBadge;
            so.FindProperty("lockedOverlay").objectReferenceValue = lockedOverlay;
            so.FindProperty("playButton").objectReferenceValue = playBtn.GetComponent<Button>();
            so.FindProperty("playButtonBg").objectReferenceValue = playBtn.GetComponent<Image>();
            so.FindProperty("playButtonText").objectReferenceValue = playBtnText;
            so.ApplyModifiedProperties();

            // 기존 GameItem.prefab도 유지 (호환성)
            EnsureDirectoryExists("Assets/Prefabs/UI");

            // 새로운 PuzzleCard 프리팹 저장
            PrefabUtility.SaveAsPrefabAsset(cardObj, "Assets/Prefabs/UI/PuzzleCard.prefab");
            DestroyImmediate(cardObj);

            // 기존 GameItem도 생성 (호환성 유지)
            CreateLegacyGameItemPrefab();

            Debug.Log("PuzzleCard prefab created (New Style)");
        }

        private static void CreateLegacyGameItemPrefab()
        {
            // 기존 스타일의 GameItem (호환성 유지)
            var framePrefab = AssetDatabase.LoadAssetAtPath<GameObject>(FRAME_PATH + "Frame_HorizontalList_L_White.prefab");

            GameObject itemObj;
            if (framePrefab != null)
            {
                itemObj = (GameObject)PrefabUtility.InstantiatePrefab(framePrefab);
                itemObj.name = "GameItem";
            }
            else
            {
                itemObj = new GameObject("GameItem");
                var rect = itemObj.AddComponent<RectTransform>();
                rect.sizeDelta = new Vector2(900, 140);
                var image = itemObj.AddComponent<Image>();
                image.color = new Color(0.95f, 0.95f, 0.98f);
            }

            var itemRect = itemObj.GetComponent<RectTransform>();
            itemRect.sizeDelta = new Vector2(900, 140);

            EnsureGameItemComponents(itemObj);

            var gameItemUI = itemObj.AddComponent<GameItemUI>();
            var bgImage = itemObj.GetComponent<Image>();
            var texts = itemObj.GetComponentsInChildren<TextMeshProUGUI>(true);
            var buttons = itemObj.GetComponentsInChildren<Button>(true);
            var images = itemObj.GetComponentsInChildren<Image>(true);

            var so = new SerializedObject(gameItemUI);
            if (bgImage != null) so.FindProperty("backgroundImage").objectReferenceValue = bgImage;
            if (texts.Length > 0) so.FindProperty("gameNameText").objectReferenceValue = texts[0];
            if (texts.Length > 1) so.FindProperty("statusText").objectReferenceValue = texts[1];
            if (texts.Length > 2) so.FindProperty("iconText").objectReferenceValue = texts[2];
            if (buttons.Length > 0) so.FindProperty("playButton").objectReferenceValue = buttons[0];

            foreach (var img in images)
            {
                if (img.gameObject != itemObj)
                {
                    if (img.name.ToLower().Contains("icon"))
                        so.FindProperty("iconImage").objectReferenceValue = img;
                    else if (img.name.ToLower().Contains("bar") || img.name.ToLower().Contains("color"))
                        so.FindProperty("colorBar").objectReferenceValue = img;
                }
            }

            so.ApplyModifiedProperties();

            PrefabUtility.SaveAsPrefabAsset(itemObj, "Assets/Prefabs/UI/GameItem.prefab");
            DestroyImmediate(itemObj);
        }

        private static void EnsureGameItemComponents(GameObject itemObj)
        {
            // Icon
            var iconObj = new GameObject("Icon");
            iconObj.transform.SetParent(itemObj.transform, false);
            var iconRect = iconObj.AddComponent<RectTransform>();
            iconRect.anchorMin = new Vector2(0, 0.5f);
            iconRect.anchorMax = new Vector2(0, 0.5f);
            iconRect.anchoredPosition = new Vector2(80, 0);
            iconRect.sizeDelta = new Vector2(90, 90);
            var iconImage = iconObj.AddComponent<Image>();
            iconImage.color = new Color(0.4f, 0.6f, 0.9f);

            var iconText = new GameObject("IconText");
            iconText.transform.SetParent(iconObj.transform, false);
            var iconTextRect = iconText.AddComponent<RectTransform>();
            iconTextRect.anchorMin = Vector2.zero;
            iconTextRect.anchorMax = Vector2.one;
            iconTextRect.sizeDelta = Vector2.zero;
            var iconTmp = iconText.AddComponent<TextMeshProUGUI>();
            iconTmp.text = "?";
            iconTmp.fontSize = 40;
            iconTmp.alignment = TextAlignmentOptions.Center;
            iconTmp.color = Color.white;

            // Game Name
            var nameObj = new GameObject("GameName");
            nameObj.transform.SetParent(itemObj.transform, false);
            var nameRect = nameObj.AddComponent<RectTransform>();
            nameRect.anchorMin = new Vector2(0, 0.5f);
            nameRect.anchorMax = new Vector2(0, 0.5f);
            nameRect.anchoredPosition = new Vector2(220, 20);
            nameRect.sizeDelta = new Vector2(300, 50);
            var nameTmp = nameObj.AddComponent<TextMeshProUGUI>();
            nameTmp.text = "Sudoku";
            nameTmp.fontSize = 32;
            nameTmp.alignment = TextAlignmentOptions.Left;
            nameTmp.fontStyle = FontStyles.Bold;
            nameTmp.color = new Color(0.2f, 0.2f, 0.3f);

            // Status
            var statusObj = new GameObject("Status");
            statusObj.transform.SetParent(itemObj.transform, false);
            var statusRect = statusObj.AddComponent<RectTransform>();
            statusRect.anchorMin = new Vector2(0, 0.5f);
            statusRect.anchorMax = new Vector2(0, 0.5f);
            statusRect.anchoredPosition = new Vector2(220, -20);
            statusRect.sizeDelta = new Vector2(300, 35);
            var statusTmp = statusObj.AddComponent<TextMeshProUGUI>();
            statusTmp.text = "Tap to Play!";
            statusTmp.fontSize = 20;
            statusTmp.alignment = TextAlignmentOptions.Left;
            statusTmp.color = new Color(0.4f, 0.7f, 0.4f);

            // Play Button
            var playBtnPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(BUTTON_PATH + "Button_Circle128_White.prefab");
            GameObject playBtn;
            if (playBtnPrefab != null)
            {
                playBtn = (GameObject)PrefabUtility.InstantiatePrefab(playBtnPrefab, itemObj.transform);
            }
            else
            {
                playBtn = new GameObject("PlayButton");
                playBtn.transform.SetParent(itemObj.transform, false);
                var pbImg = playBtn.AddComponent<Image>();
                pbImg.color = new Color(0.4f, 0.8f, 0.4f);
                playBtn.AddComponent<Button>();
            }

            playBtn.name = "PlayButton";
            var pbRect = playBtn.GetComponent<RectTransform>();
            pbRect.anchorMin = new Vector2(1, 0.5f);
            pbRect.anchorMax = new Vector2(1, 0.5f);
            pbRect.anchoredPosition = new Vector2(-70, 0);
            pbRect.sizeDelta = new Vector2(80, 80);

            var pbText = playBtn.GetComponentInChildren<TextMeshProUGUI>();
            if (pbText != null) pbText.text = ">";

            // Color Bar
            var colorBar = new GameObject("ColorBar");
            colorBar.transform.SetParent(itemObj.transform, false);
            var cbRect = colorBar.AddComponent<RectTransform>();
            cbRect.anchorMin = new Vector2(0, 0);
            cbRect.anchorMax = new Vector2(0, 1);
            cbRect.anchoredPosition = new Vector2(8, 0);
            cbRect.sizeDelta = new Vector2(8, -20);
            var cbImage = colorBar.AddComponent<Image>();
            cbImage.color = new Color(0.4f, 0.6f, 0.9f);
        }

        private static void CreateCellPrefab()
        {
            var btnPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(BUTTON_PATH + "Button_Square06_White.prefab");

            GameObject cellObj;
            if (btnPrefab != null)
            {
                cellObj = (GameObject)PrefabUtility.InstantiatePrefab(btnPrefab);
                cellObj.name = "Cell";
            }
            else
            {
                cellObj = new GameObject("Cell");
                var image = cellObj.AddComponent<Image>();
                image.color = new Color(0.98f, 0.98f, 1f);
                cellObj.AddComponent<Button>();
            }

            var rect = cellObj.GetComponent<RectTransform>();
            rect.sizeDelta = new Vector2(72, 72);

            var button = cellObj.GetComponent<Button>();
            if (button != null)
            {
                var colors = button.colors;
                colors.highlightedColor = new Color(1f, 0.95f, 0.8f);
                colors.pressedColor = new Color(0.95f, 0.85f, 0.6f);
                colors.selectedColor = new Color(0.85f, 0.92f, 1f);
                button.colors = colors;
            }

            // 텍스트가 없으면 추가
            var existingText = cellObj.GetComponentInChildren<TextMeshProUGUI>();
            if (existingText == null)
            {
                var textObj = new GameObject("Text");
                textObj.transform.SetParent(cellObj.transform, false);
                var textRect = textObj.AddComponent<RectTransform>();
                textRect.anchorMin = Vector2.zero;
                textRect.anchorMax = Vector2.one;
                textRect.sizeDelta = Vector2.zero;

                var tmp = textObj.AddComponent<TextMeshProUGUI>();
                tmp.text = "";
                tmp.fontSize = 34;
                tmp.alignment = TextAlignmentOptions.Center;
                tmp.color = new Color(0.2f, 0.2f, 0.3f);
                tmp.fontStyle = FontStyles.Bold;
            }
            else
            {
                existingText.text = "";
                existingText.fontSize = 34;
                existingText.color = new Color(0.2f, 0.2f, 0.3f);
            }

            EnsureDirectoryExists("Assets/Prefabs/UI");
            PrefabUtility.SaveAsPrefabAsset(cellObj, "Assets/Prefabs/UI/Cell.prefab");
            DestroyImmediate(cellObj);

            Debug.Log("Cell prefab created");
        }

        private static void CreateNumberButtonPrefab()
        {
            var btnPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(BUTTON_PATH + "Button_Square05_Blue.prefab");

            GameObject btnObj;
            if (btnPrefab != null)
            {
                btnObj = (GameObject)PrefabUtility.InstantiatePrefab(btnPrefab);
                btnObj.name = "NumberButton";
            }
            else
            {
                btnObj = new GameObject("NumberButton");
                var image = btnObj.AddComponent<Image>();
                image.color = new Color(0.35f, 0.55f, 0.85f);
                btnObj.AddComponent<Button>();
            }

            var rect = btnObj.GetComponent<RectTransform>();
            rect.sizeDelta = new Vector2(65, 65);

            var existingText = btnObj.GetComponentInChildren<TextMeshProUGUI>();
            if (existingText == null)
            {
                var textObj = new GameObject("Text");
                textObj.transform.SetParent(btnObj.transform, false);
                var textRect = textObj.AddComponent<RectTransform>();
                textRect.anchorMin = Vector2.zero;
                textRect.anchorMax = Vector2.one;
                textRect.sizeDelta = Vector2.zero;

                var tmp = textObj.AddComponent<TextMeshProUGUI>();
                tmp.text = "1";
                tmp.fontSize = 28;
                tmp.alignment = TextAlignmentOptions.Center;
                tmp.color = Color.white;
                tmp.fontStyle = FontStyles.Bold;
            }
            else
            {
                existingText.text = "1";
                existingText.fontSize = 28;
                existingText.color = Color.white;
            }

            EnsureDirectoryExists("Assets/Prefabs/UI");
            PrefabUtility.SaveAsPrefabAsset(btnObj, "Assets/Prefabs/UI/NumberButton.prefab");
            DestroyImmediate(btnObj);

            Debug.Log("NumberButton prefab created");
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

using UnityEngine;
using UnityEngine.UI;
using UnityEditor;
using TMPro;

namespace PuzzleBattle.Editor
{
    /// <summary>
    /// 씬 자동 구성 에디터 스크립트
    /// </summary>
    public class SceneSetup : MonoBehaviour
    {
        [MenuItem("PuzzleBattle/Setup Scene")]
        public static void SetupScene()
        {
            // 1. Managers 오브젝트 생성
            CreateManagers();

            // 2. Canvas 생성
            CreateCanvas();

            // 3. 스도쿠 게임 오브젝트 생성
            CreateSudokuGame();

            Debug.Log("=== PuzzleBattle Scene Setup Complete! ===");
        }

        private static void CreateManagers()
        {
            // GameManager
            if (Object.FindObjectOfType<Core.GameManager>() == null)
            {
                var gmObj = new GameObject("GameManager");
                gmObj.AddComponent<Core.GameManager>();
                Debug.Log("GameManager created");
            }

            // TimerManager
            if (Object.FindObjectOfType<Core.TimerManager>() == null)
            {
                var tmObj = new GameObject("TimerManager");
                tmObj.AddComponent<Core.TimerManager>();
                Debug.Log("TimerManager created");
            }

            // ScoreManager
            if (Object.FindObjectOfType<Core.ScoreManager>() == null)
            {
                var smObj = new GameObject("ScoreManager");
                smObj.AddComponent<Core.ScoreManager>();
                Debug.Log("ScoreManager created");
            }
        }

        private static void CreateCanvas()
        {
            // 기존 Canvas 확인
            var existingCanvas = Object.FindObjectOfType<Canvas>();
            if (existingCanvas != null)
            {
                Debug.Log("Canvas already exists");
                return;
            }

            // Canvas 생성
            var canvasObj = new GameObject("Canvas");
            var canvas = canvasObj.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvasObj.AddComponent<CanvasScaler>();
            canvasObj.AddComponent<GraphicRaycaster>();

            // CanvasScaler 설정 (모바일 대응)
            var scaler = canvasObj.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1080, 1920);
            scaler.matchWidthOrHeight = 0.5f;

            // EventSystem
            if (Object.FindObjectOfType<UnityEngine.EventSystems.EventSystem>() == null)
            {
                var eventSystem = new GameObject("EventSystem");
                eventSystem.AddComponent<UnityEngine.EventSystems.EventSystem>();
                eventSystem.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();
            }

            // UI Panels 생성
            CreateUIPanel(canvasObj.transform, "MainMenuPanel", true);
            CreateUIPanel(canvasObj.transform, "GamePanel", false);
            CreateUIPanel(canvasObj.transform, "ResultPanel", false);

            Debug.Log("Canvas and UI Panels created");
        }

        private static GameObject CreateUIPanel(Transform parent, string name, bool active)
        {
            var panel = new GameObject(name);
            panel.transform.SetParent(parent, false);

            var rect = panel.AddComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.sizeDelta = Vector2.zero;

            var image = panel.AddComponent<Image>();
            image.color = new Color(0.1f, 0.1f, 0.1f, 0.95f);

            panel.SetActive(active);
            return panel;
        }

        private static void CreateSudokuGame()
        {
            // SudokuGame 오브젝트
            if (Object.FindObjectOfType<Games.Sudoku.SudokuPuzzle>() == null)
            {
                var sudokuObj = new GameObject("SudokuGame");
                sudokuObj.AddComponent<Games.Sudoku.SudokuPuzzle>();
                sudokuObj.AddComponent<Games.Sudoku.SudokuUI>();
                Debug.Log("SudokuGame created");
            }
        }

        [MenuItem("PuzzleBattle/Create Cell Prefab")]
        public static void CreateCellPrefab()
        {
            // Cell 프리팹 생성
            var cellObj = new GameObject("Cell");

            var rect = cellObj.AddComponent<RectTransform>();
            rect.sizeDelta = new Vector2(80, 80);

            var image = cellObj.AddComponent<Image>();
            image.color = Color.white;

            var button = cellObj.AddComponent<Button>();
            button.targetGraphic = image;

            // Text 추가
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
            tmp.color = Color.black;

            // 프리팹 저장
            string prefabPath = "Assets/Prefabs/UI/Cell.prefab";
            EnsureDirectoryExists("Assets/Prefabs/UI");
            PrefabUtility.SaveAsPrefabAsset(cellObj, prefabPath);
            DestroyImmediate(cellObj);

            Debug.Log($"Cell prefab created at {prefabPath}");
        }

        [MenuItem("PuzzleBattle/Create NumberButton Prefab")]
        public static void CreateNumberButtonPrefab()
        {
            // NumberButton 프리팹 생성
            var btnObj = new GameObject("NumberButton");

            var rect = btnObj.AddComponent<RectTransform>();
            rect.sizeDelta = new Vector2(100, 60);

            var image = btnObj.AddComponent<Image>();
            image.color = new Color(0.3f, 0.5f, 0.8f);

            var button = btnObj.AddComponent<Button>();
            button.targetGraphic = image;

            // Text 추가
            var textObj = new GameObject("Text");
            textObj.transform.SetParent(btnObj.transform, false);

            var textRect = textObj.AddComponent<RectTransform>();
            textRect.anchorMin = Vector2.zero;
            textRect.anchorMax = Vector2.one;
            textRect.sizeDelta = Vector2.zero;

            var tmp = textObj.AddComponent<TextMeshProUGUI>();
            tmp.text = "1";
            tmp.fontSize = 32;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = Color.white;

            // 프리팹 저장
            string prefabPath = "Assets/Prefabs/UI/NumberButton.prefab";
            EnsureDirectoryExists("Assets/Prefabs/UI");
            PrefabUtility.SaveAsPrefabAsset(btnObj, prefabPath);
            DestroyImmediate(btnObj);

            Debug.Log($"NumberButton prefab created at {prefabPath}");
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
    }
}

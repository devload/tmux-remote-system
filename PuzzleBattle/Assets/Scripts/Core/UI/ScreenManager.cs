using UnityEngine;
using System;
using System.Collections.Generic;

namespace PuzzleBattle.UI
{
    /// <summary>
    /// 화면 전환 관리
    /// </summary>
    public class ScreenManager : MonoBehaviour
    {
        public static ScreenManager Instance { get; private set; }

        [Header("Screens")]
        [SerializeField] private GameObject loginScreen;
        [SerializeField] private GameObject mainScreen;
        [SerializeField] private GameObject gameScreen;
        [SerializeField] private GameObject resultScreen;

        public ScreenType CurrentScreen { get; private set; } = ScreenType.Login;

        public event Action<ScreenType> OnScreenChanged;

        private Dictionary<ScreenType, GameObject> screens;

        private void Awake()
        {
            Debug.Log("ScreenManager Awake called");
            if (Instance == null)
            {
                Instance = this;
                Debug.Log("ScreenManager instance created in Awake");
            }
            else if (Instance != this)
            {
                Debug.Log("Duplicate ScreenManager, destroying...");
                Destroy(gameObject);
                return;
            }
        }

        private void Start()
        {
            Debug.Log("ScreenManager Start called");

            // Awake에서 못했으면 여기서 설정
            if (Instance == null)
            {
                Instance = this;
                Debug.Log("ScreenManager instance created in Start");
            }

            screens = new Dictionary<ScreenType, GameObject>
            {
                { ScreenType.Login, loginScreen },
                { ScreenType.Main, mainScreen },
                { ScreenType.Game, gameScreen },
                { ScreenType.Result, resultScreen }
            };

            Debug.Log($"Screens setup: Login={loginScreen != null}, Main={mainScreen != null}");
            ShowScreen(ScreenType.Login);
        }

        public void ShowScreen(ScreenType screenType)
        {
            // 모든 화면 숨기기
            foreach (var screen in screens.Values)
            {
                if (screen != null)
                    screen.SetActive(false);
            }

            // 해당 화면 표시
            if (screens.ContainsKey(screenType) && screens[screenType] != null)
            {
                screens[screenType].SetActive(true);
                CurrentScreen = screenType;
                OnScreenChanged?.Invoke(screenType);
                Debug.Log($"Screen changed to: {screenType}");
            }
        }

        // 편의 메서드들
        public void GoToLogin() => ShowScreen(ScreenType.Login);
        public void GoToMain() => ShowScreen(ScreenType.Main);
        public void GoToGame() => ShowScreen(ScreenType.Game);
        public void GoToResult() => ShowScreen(ScreenType.Result);
    }

    public enum ScreenType
    {
        Login,
        Main,
        Game,
        Result
    }
}

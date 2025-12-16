using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace PuzzleBattle.UI
{
    /// <summary>
    /// 로그인 화면
    /// </summary>
    public class LoginScreen : MonoBehaviour
    {
        [Header("UI Elements")]
        [SerializeField] private Button loginButton;
        [SerializeField] private TextMeshProUGUI titleText;

        private void Start()
        {
            if (loginButton != null)
            {
                loginButton.onClick.RemoveAllListeners();
                loginButton.onClick.AddListener(OnLoginClicked);
                Debug.Log("Login button listener added");
            }
            else
            {
                Debug.LogWarning("Login button is not assigned!");
            }
        }

        private void OnEnable()
        {
            // OnEnable에서도 버튼 연결 시도
            if (loginButton != null)
            {
                loginButton.onClick.RemoveAllListeners();
                loginButton.onClick.AddListener(OnLoginClicked);
            }
        }

        private void OnLoginClicked()
        {
            Debug.Log("Login clicked - moving to main screen");

            // ScreenManager 찾기
            var screenManager = ScreenManager.Instance;

            if (screenManager == null)
            {
                Debug.Log("Instance null, trying FindObjectOfType...");
                screenManager = FindObjectOfType<ScreenManager>(true); // 비활성화된 것도 찾기
            }

            if (screenManager != null)
            {
                Debug.Log("ScreenManager found, going to main");
                screenManager.GoToMain();
            }
            else
            {
                Debug.LogError("ScreenManager not found anywhere!");
            }
        }
    }
}

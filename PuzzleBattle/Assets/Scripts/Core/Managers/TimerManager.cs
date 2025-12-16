using UnityEngine;
using System;

namespace PuzzleBattle.Core
{
    /// <summary>
    /// 게임 타이머 관리
    /// </summary>
    public class TimerManager : MonoBehaviour
    {
        public static TimerManager Instance { get; private set; }

        [Header("Timer Settings")]
        [SerializeField] private bool countDown = true;

        public float TimeRemaining { get; private set; }
        public float TotalTime { get; private set; }
        public bool IsRunning { get; private set; }
        public float Progress => TotalTime > 0 ? TimeRemaining / TotalTime : 0f;

        // 이벤트
        public event Action<float> OnTimeChanged;
        public event Action OnTimeUp;
        public event Action<float> OnWarningTime; // 30초, 10초 등 경고

        private bool warned30Sec = false;
        private bool warned10Sec = false;

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void Update()
        {
            if (!IsRunning) return;

            if (countDown)
            {
                TimeRemaining -= Time.deltaTime;

                // 경고 체크
                if (!warned30Sec && TimeRemaining <= 30f)
                {
                    warned30Sec = true;
                    OnWarningTime?.Invoke(30f);
                }
                if (!warned10Sec && TimeRemaining <= 10f)
                {
                    warned10Sec = true;
                    OnWarningTime?.Invoke(10f);
                }

                if (TimeRemaining <= 0)
                {
                    TimeRemaining = 0;
                    IsRunning = false;
                    OnTimeUp?.Invoke();
                }
            }
            else
            {
                TimeRemaining += Time.deltaTime;
            }

            OnTimeChanged?.Invoke(TimeRemaining);
        }

        /// <summary>
        /// 타이머 시작
        /// </summary>
        public void StartTimer(float duration)
        {
            TotalTime = duration;
            TimeRemaining = countDown ? duration : 0f;
            IsRunning = true;
            warned30Sec = false;
            warned10Sec = false;

            Debug.Log($"Timer started: {duration} seconds");
        }

        /// <summary>
        /// 타이머 일시정지
        /// </summary>
        public void PauseTimer()
        {
            IsRunning = false;
        }

        /// <summary>
        /// 타이머 재개
        /// </summary>
        public void ResumeTimer()
        {
            IsRunning = true;
        }

        /// <summary>
        /// 타이머 정지
        /// </summary>
        public void StopTimer()
        {
            IsRunning = false;
        }

        /// <summary>
        /// 시간 추가 (힌트 페널티 등)
        /// </summary>
        public void AddTime(float seconds)
        {
            if (countDown)
            {
                TimeRemaining = Mathf.Max(0, TimeRemaining + seconds);
            }
            Debug.Log($"Time added: {seconds} seconds. Remaining: {TimeRemaining}");
        }

        /// <summary>
        /// 시간 감소 (방해 아이템 등)
        /// </summary>
        public void ReduceTime(float seconds)
        {
            if (countDown)
            {
                TimeRemaining = Mathf.Max(0, TimeRemaining - seconds);
                if (TimeRemaining <= 0)
                {
                    IsRunning = false;
                    OnTimeUp?.Invoke();
                }
            }
            Debug.Log($"Time reduced: {seconds} seconds. Remaining: {TimeRemaining}");
        }

        /// <summary>
        /// 포맷된 시간 문자열 반환
        /// </summary>
        public string GetFormattedTime()
        {
            int minutes = Mathf.FloorToInt(TimeRemaining / 60);
            int seconds = Mathf.FloorToInt(TimeRemaining % 60);
            return $"{minutes:00}:{seconds:00}";
        }

        /// <summary>
        /// 현재 남은 시간 반환
        /// </summary>
        public float GetCurrentTime()
        {
            return TimeRemaining;
        }
    }
}

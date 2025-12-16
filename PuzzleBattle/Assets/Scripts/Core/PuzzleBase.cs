using UnityEngine;
using System;

namespace PuzzleBattle.Core
{
    /// <summary>
    /// 모든 퍼즐 게임의 베이스 클래스
    /// </summary>
    public abstract class PuzzleBase : MonoBehaviour
    {
        [Header("Puzzle Settings")]
        [SerializeField] protected int gridSize = 9;
        [SerializeField] protected int difficulty = 1; // 1-5

        public PuzzleType PuzzleType { get; protected set; }
        public bool IsCompleted { get; protected set; }
        public bool IsPaused { get; protected set; }

        // 이벤트
        public event Action OnPuzzleCompleted;
        public event Action OnPuzzleFailed;
        public event Action<int, int> OnCellChanged; // row, col

        protected virtual void Start()
        {
            // 타이머 이벤트 연결
            if (TimerManager.Instance != null)
            {
                TimerManager.Instance.OnTimeUp += HandleTimeUp;
            }
        }

        protected virtual void OnDestroy()
        {
            if (TimerManager.Instance != null)
            {
                TimerManager.Instance.OnTimeUp -= HandleTimeUp;
            }
        }

        /// <summary>
        /// 퍼즐 초기화
        /// </summary>
        public abstract void InitializePuzzle(int difficulty);

        /// <summary>
        /// 퍼즐 데이터 생성
        /// </summary>
        protected abstract void GeneratePuzzle();

        /// <summary>
        /// 정답 검증
        /// </summary>
        public abstract bool ValidateSolution();

        /// <summary>
        /// 힌트 제공
        /// </summary>
        public abstract void ProvideHint();

        /// <summary>
        /// 퍼즐 리셋
        /// </summary>
        public abstract void ResetPuzzle();

        /// <summary>
        /// 셀 값 변경
        /// </summary>
        public virtual void SetCellValue(int row, int col, int value)
        {
            OnCellChanged?.Invoke(row, col);
            CheckCompletion();
        }

        /// <summary>
        /// 완료 체크
        /// </summary>
        protected virtual void CheckCompletion()
        {
            if (ValidateSolution())
            {
                IsCompleted = true;
                OnPuzzleCompleted?.Invoke();

                float timeRemaining = TimerManager.Instance?.TimeRemaining ?? 0;
                int score = ScoreManager.Instance?.CalculateFinalScore(timeRemaining, difficulty) ?? 0;

                GameManager.Instance?.CompletePuzzle(score, timeRemaining);
            }
        }

        /// <summary>
        /// 시간 초과 처리
        /// </summary>
        protected virtual void HandleTimeUp()
        {
            if (!IsCompleted)
            {
                OnPuzzleFailed?.Invoke();
                GameManager.Instance?.FailPuzzle();
            }
        }

        /// <summary>
        /// 일시정지
        /// </summary>
        public virtual void Pause()
        {
            IsPaused = true;
            TimerManager.Instance?.PauseTimer();
        }

        /// <summary>
        /// 재개
        /// </summary>
        public virtual void Resume()
        {
            IsPaused = false;
            TimerManager.Instance?.ResumeTimer();
        }

        /// <summary>
        /// 난이도별 시간 제한 반환
        /// </summary>
        protected virtual float GetTimeLimit()
        {
            return difficulty switch
            {
                1 => 300f, // Easy: 5분
                2 => 240f, // Medium: 4분
                3 => 180f, // Hard: 3분
                4 => 120f, // Expert: 2분
                5 => 90f,  // Master: 1.5분
                _ => 300f
            };
        }
    }
}

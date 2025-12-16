using UnityEngine;
using System;

namespace PuzzleBattle.Core
{
    /// <summary>
    /// 점수 계산 및 관리
    /// </summary>
    public class ScoreManager : MonoBehaviour
    {
        public static ScoreManager Instance { get; private set; }

        [Header("Score Settings")]
        [SerializeField] private int baseScore = 1000;
        [SerializeField] private int hintPenalty = 100;
        [SerializeField] private float timeMultiplier = 10f;

        public int CurrentScore { get; private set; }
        public int HintsUsed { get; private set; }

        // 이벤트
        public event Action<int> OnScoreChanged;

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

        /// <summary>
        /// 점수 초기화 (게임 시작 시)
        /// </summary>
        public void ResetScore()
        {
            CurrentScore = 0;
            HintsUsed = 0;
            OnScoreChanged?.Invoke(CurrentScore);
        }

        /// <summary>
        /// 퍼즐 완료 시 최종 점수 계산
        /// </summary>
        public int CalculateFinalScore(float timeRemaining, int difficulty)
        {
            // 기본 점수
            int score = baseScore * difficulty;

            // 힌트 페널티
            score -= HintsUsed * hintPenalty;

            // 시간 보너스
            int timeBonus = Mathf.RoundToInt(timeRemaining * timeMultiplier);
            score += timeBonus;

            // 최소 점수 보장
            score = Mathf.Max(score, 100);

            CurrentScore = score;
            OnScoreChanged?.Invoke(CurrentScore);

            Debug.Log($"Final score: {score} (Base: {baseScore * difficulty}, Hints: -{HintsUsed * hintPenalty}, Time bonus: +{timeBonus})");

            return score;
        }

        /// <summary>
        /// 힌트 사용 기록
        /// </summary>
        public void UseHint()
        {
            HintsUsed++;
            Debug.Log($"Hint used. Total hints: {HintsUsed}");
        }

        /// <summary>
        /// 점수 추가 (특수 보너스 등)
        /// </summary>
        public void AddBonus(int bonus)
        {
            CurrentScore += bonus;
            OnScoreChanged?.Invoke(CurrentScore);
            Debug.Log($"Bonus added: {bonus}. Total: {CurrentScore}");
        }

        /// <summary>
        /// 현재 점수 반환
        /// </summary>
        public int GetCurrentScore()
        {
            return CurrentScore;
        }
    }
}

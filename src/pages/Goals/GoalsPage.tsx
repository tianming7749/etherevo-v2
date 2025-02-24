import React, { useState, useEffect } from "react";
import { useUserContext } from "../../context/UserContext";
import { saveUserGoals, fetchUserGoals } from "../../utils/supabaseHelpers";
import { generatePromptsForUser } from "../../utils/generatePrompts";
import { supabase } from "../../supabaseClient";
import "./GoalsPage.css";
import { useTranslation } from 'react-i18next';

const GoalsPage: React.FC = () => {
  const { userId } = useUserContext();
  const [goals, setGoals] = useState<string[]>([]); // 保存 key（如 "reduce_anxiety"）
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const predefinedGoals = t('goalsPage.predefinedGoals', { returnObjects: true }) as Record<string, string>;
  const goalKeys = Object.keys(predefinedGoals); // 获取所有目标的 key

  useEffect(() => {
    const loadUserGoals = async () => {
      setError(null);
      try {
        const savedGoals = await fetchUserGoals(userId);
        
        let parsedGoals: string[] = [];
        if (Array.isArray(savedGoals)) {
          parsedGoals = savedGoals;
        } else if (typeof savedGoals === 'string') {
          try {
            parsedGoals = JSON.parse(savedGoals);
          } catch (e) {
            console.error("解析存储的目标时出错：", e);
          }
        }
        // 确保加载的 goals 是有效的 key
        setGoals(Array.isArray(parsedGoals) ? parsedGoals.filter(goal => goalKeys.includes(goal)) : []);
      } catch (err) {
        console.error("加载用户目标时出错：", err);
        setError(t('goalsPage.errorMessage'));
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadUserGoals();
    }
  }, [userId, t]);

  const handleGoalSelection = (goalKey: string) => {
    setGoals((prevGoals) => {
      if (!Array.isArray(prevGoals)) {
        console.error("prevGoals 不是数组：", prevGoals);
        return [goalKey];
      }

      if (prevGoals.includes(goalKey)) {
        return prevGoals.filter((g) => g !== goalKey);
      } else if (prevGoals.length < 3) {
        return [...prevGoals, goalKey];
      } else {
        alert(t('goalsPage.maxGoalsAlert'));
        return prevGoals;
      }
    });
  };

  const handleSaveGoals = async () => {
    try {
      await saveUserGoals(userId, JSON.stringify(goals)); // 保存 key 数组
      alert(t('goalsPage.saveSuccessAlert'));

      const updatedPrompt = await generatePromptsForUser(userId);
      if (updatedPrompt) {
        await saveUserPrompt(userId, updatedPrompt);
        console.log("提示词已更新并保存。");
      } else {
        console.warn("未能生成或保存新的提示词。");
      }
    } catch (err) {
      console.error("保存目标或更新提示词时出错：", err);
      alert(t('goalsPage.saveErrorAlert'));
    }
  };

  if (!userId) return <p>{t('goalsPage.noLoginMessage')}</p>;

  return (
    <div className="goals-page">
      <h1>{t('goalsPage.title')}</h1>
      <p>{t('goalsPage.description')}</p>
      {error && <p className="error-message">{error}</p>}
      <div>
        {goalKeys.map((goalKey) => (
          <div key={goalKey} className="goal-item">
            <label>
              <input
                type="checkbox"
                checked={goals.includes(goalKey)}
                onChange={() => handleGoalSelection(goalKey)}
                disabled={isLoading}
              />
              {predefinedGoals[goalKey]} {/* 显示翻译后的文本 */}
            </label>
          </div>
        ))}
      </div>
      <button
        onClick={handleSaveGoals}
        disabled={goals.length === 0}
      >
        {t('goalsPage.saveButton')}
      </button>
    </div>
  );
};

// 保存提示词的辅助函数（保持不变）
async function saveUserPrompt(userId: string, prompt: string) {
  try {
    const { error } = await supabase
      .from("user_prompts_summary")
      .upsert({
        user_id: userId,
        full_prompt: prompt,
      },
      { onConflict: ["user_id"] });
    
    if (error) throw error;
  } catch (err) {
    console.error("保存提示词失败：", err.message);
  }
}

export default GoalsPage;
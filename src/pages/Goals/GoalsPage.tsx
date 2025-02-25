import React, { useState, useEffect } from "react";
import { useUserContext } from "../../context/UserContext";
import { saveUserGoals, fetchUserGoals } from "../../utils/supabaseHelpers";
import { generatePromptsForUser } from "../../utils/generatePrompts";
import { supabase } from "../../supabaseClient";
import "./GoalsPage.css";
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom'; // 导入 useNavigate

const GoalsPage: React.FC = () => {
  const { userId } = useUserContext();
  const [goals, setGoals] = useState<string[]>([]); // 保存 key（如 "reduce_anxiety"）
  const [isLoading, setIsLoading] = useState<boolean>(true); // 添加加载状态
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const navigate = useNavigate(); // 使用 useNavigate 钩子

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
        alert(t('goalsPage.maxGoalsAlert')); // 保持验证失败的提示，类似 TonesPage
        return prevGoals;
      }
    });
  };

  const handleSaveGoals = async () => {
    if (goals.length === 0) { // 验证是否选择了目标，类似 TonesPage 的 !selectedToneId
      alert(t('goalsPage.noGoalsSelectionAlert')); // 添加新的翻译键或复用现有键（如 t('goalsPage.toneSelectionAlert')）
      return;
    }

    setIsLoading(true); // 开始保存时设置加载状态
    try {
      await saveUserGoals(userId, JSON.stringify(goals)); // 保存 key 数组
      const updatedPrompt = await generatePromptsForUser(userId);
      if (updatedPrompt) {
        await saveUserPrompt(userId, updatedPrompt);
        console.log("提示词已更新并保存。");
      } else {
        throw new Error("未能生成或保存新的提示词。");
      }

      alert(t('goalsPage.saveSuccessAlert')); // 保持成功提示
      navigate('/settings/user-info'); // 保存成功后跳转到 UserInfo 页面
    } catch (err) {
      console.error("保存目标或更新提示词时出错：", err);
      alert(t('goalsPage.saveErrorAlert')); // 保持失败提示
    } finally {
      setIsLoading(false); // 保存完成（无论成功或失败）重置加载状态
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
                disabled={isLoading} // 禁用输入框以匹配加载状态
              />
              {predefinedGoals[goalKey]} {/* 显示翻译后的文本 */}
            </label>
          </div>
        ))}
      </div>
      <button
        onClick={handleSaveGoals}
        disabled={isLoading || goals.length === 0} // 根据加载状态和目标数量禁用按钮
      >
        {isLoading ? t('goalsPage.savingButton') : t('goalsPage.saveButton')} 
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
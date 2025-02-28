// GoalsPage.tsx
import React, { useState, useEffect } from "react";
import { useUserContext } from "../../context/UserContext";
import { saveUserGoals, fetchUserGoals } from "../../utils/supabaseHelpers";
import { generatePromptsForUser } from "../../utils/generatePrompts";
import { supabase } from "../../supabaseClient";
import "./GoalsPage.css";
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom'; // 导入 useNavigate

const GoalsPage: React.FC = () => {
  const { userId } = useUserContext(); // 仅使用 userId
  const [goals, setGoals] = useState<string[]>([]); // 保存 key（如 "reduce_anxiety"）
  const [isLoading, setIsLoading] = useState(true); // 用于初始加载
  const [isSaving, setIsSaving] = useState(false); // 用于保存时的加载状态
  const [error, setError] = useState<string | null>(null); // 添加错误状态
  const [saveStatus, setSaveStatus] = useState<string>(''); // 保存状态反馈
  const { t } = useTranslation();
  const navigate = useNavigate(); // 使用 useNavigate 钩子

  const predefinedGoals = t('goalsPage.predefinedGoals', { returnObjects: true }) as Record<string, string>;
  const goalKeys = Object.keys(predefinedGoals); // 获取所有目标的 key

  useEffect(() => {
    const loadUserGoals = async () => {
      if (!userId) {
        setIsLoading(false); // 如果没有 userId，直接结束加载状态
        setError(t('goalsPage.noLoginMessage'));
        return;
      }

      setIsLoading(true); // 开始加载时设置 isLoading 为 true
      setError(null); // 重置错误状态
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
        setIsLoading(false); // 加载完成，设置 isLoading 为 false
      }
    };

    loadUserGoals();
  }, [userId, t]); // 依赖项优化为 userId 和 t，确保仅在必要时触发

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
        alert(t('goalsPage.maxGoalsAlert')); // 保持验证失败的提示
        return prevGoals;
      }
    });
  };

  const handleSaveGoals = async () => {
    if (!userId) {
      alert(t('goalsPage.noLoginMessage'));
      return;
    }

    if (goals.length === 0) { // 验证是否选择了目标
      alert(t('goalsPage.noGoalsSelectionAlert'));
      return;
    }

    setIsSaving(true); // 开始保存时设置 isSaving，而不是 isLoading
    setSaveStatus(t('goalsPage.savingButton')); // 显示“Saving...”

    try {
      await saveUserGoals(userId, JSON.stringify(goals)); // 保存 key 数组
      const updatedPrompt = await generatePromptsForUser(userId);
      if (updatedPrompt) {
        await saveUserPrompt(userId, updatedPrompt);
        console.log("提示词已更新并保存。");
      } else {
        throw new Error(t('goalsPage.savePromptError', 'Failed to generate or save the prompt.'));
      }

      setSaveStatus(t('goalsPage.saveSuccessAlert')); // 显示“Saved!”
      setTimeout(() => {
        setSaveStatus(''); // 2秒后恢复为“Save”
        navigate('/settings/user-info'); // 跳转到 UserInfo 页面
      }, 2000);
    } catch (err) {
      console.error("保存目标或更新提示词时出错：", err);
      setSaveStatus(t('goalsPage.saveErrorAlert')); // 显示保存失败提示
      setTimeout(() => setSaveStatus(''), 2000); // 2秒后清空
    } finally {
      setIsSaving(false); // 保存完成（无论成功或失败）重置 isSaving
    }
  };

  const handleSkip = () => {
    // 跳过当前页面，直接导航到下一个页面（UserInfo）
    if (!userId) {
      alert(t('goalsPage.noLoginMessage'));
      return;
    }
    navigate('/settings/user-info'); // 直接跳转，无反馈
  };

  if (isLoading) {
    return <div className="loading-message">{t('goalsPage.loadingMessage', 'Loading...')}</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="goals-page">
      <h1>{t('goalsPage.title')}</h1>
      <p>{t('goalsPage.description')}</p>
      <div>
        {goalKeys.map((goalKey) => (
          <div key={goalKey} className="goal-item">
            <label>
              <input
                type="checkbox"
                checked={goals.includes(goalKey)}
                onChange={() => handleGoalSelection(goalKey)}
                disabled={isSaving} // 使用 isSaving 禁用输入框（仅在保存时）
              />
              {predefinedGoals[goalKey]} {/* 显示翻译后的文本 */}
            </label>
          </div>
        ))}
      </div>
      <div className="buttons-container"> {/* 添加容器以并排放置按钮 */}
        <button onClick={handleSkip} disabled={!userId}> {/* 仅在未登录时禁用 */}
          {t('goalsPage.skipButton', 'Skip')} {/* 保持原始文本，无状态反馈 */}
        </button>
        <button
          onClick={handleSaveGoals}
          disabled={isSaving || goals.length === 0} // 根据保存状态和目标数量禁用按钮
        >
          {saveStatus || (isSaving ? t('goalsPage.savingButton', 'Saving...') : t('goalsPage.saveButton', 'Save'))}
        </button>
      </div>
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
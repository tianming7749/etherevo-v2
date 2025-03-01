import React, { useState, useEffect } from "react";
import { useUserContext } from "../../context/UserContext";
import { saveUserGoals, fetchUserGoals } from "../../utils/supabaseHelpers";
import { generatePromptsForUser } from "../../utils/generatePrompts";
import { supabase } from "../../supabaseClient";
import "./GoalsPage.css";
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const GoalsPage: React.FC = () => {
  const { userId } = useUserContext();
  const [goals, setGoals] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const { t } = useTranslation();
  const navigate = useNavigate();

  const predefinedGoals = t('goalsPage.predefinedGoals', { returnObjects: true }) as Record<string, string>;
  const goalKeys = Object.keys(predefinedGoals);

  useEffect(() => {
    const loadUserGoals = async () => {
      if (!userId) {
        setIsLoading(false);
        setError(t('goalsPage.noLoginMessage'));
        return;
      }

      setIsLoading(true);
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
        setGoals(Array.isArray(parsedGoals) ? parsedGoals.filter(goal => goalKeys.includes(goal)) : []);
      } catch (err) {
        console.error("加载用户目标时出错：", err);
        setError(t('goalsPage.errorMessage'));
      } finally {
        setIsLoading(false);
      }
    };

    loadUserGoals();
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
    if (!userId) {
      alert(t('goalsPage.noLoginMessage'));
      return;
    }

    if (goals.length === 0) {
      alert(t('goalsPage.noGoalsSelectionAlert'));
      return;
    }

    setIsSaving(true);
    setSaveStatus(t('goalsPage.savingButton'));

    try {
      await saveUserGoals(userId, JSON.stringify(goals));
      const updatedPrompt = await generatePromptsForUser(userId);
      if (updatedPrompt) {
        await saveUserPrompt(userId, updatedPrompt);
        console.log("提示词已更新并保存。");
      } else {
        throw new Error(t('goalsPage.savePromptError', 'Failed to generate or save the prompt.'));
      }

      setSaveStatus(t('goalsPage.saveSuccessAlert'));
      setTimeout(() => {
        setSaveStatus('');
        navigate('/settings/user-info');
      }, 2000);
    } catch (err) {
      console.error("保存目标或更新提示词时出错：", err);
      setSaveStatus(t('goalsPage.saveErrorAlert'));
      setTimeout(() => setSaveStatus(''), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    if (!userId) {
      alert(t('goalsPage.noLoginMessage'));
      return;
    }
    if (isSaving) {
      alert(t('goalsPage.savingInProgress', 'Saving is in progress, please wait.'));
      return;
    }
    navigate('/settings/user-info');
  };

  if (isLoading) {
    return <div className="loading-message">{t('goalsPage.loadingMessage')}</div>;
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
                disabled={isSaving}
              />
              {predefinedGoals[goalKey]}
            </label>
          </div>
        ))}
      </div>
      <div className="buttons-container">
        <button
          onClick={handleSkip}
          disabled={!userId || isSaving}
        >
          {t('goalsPage.skipButton', 'Skip')}
        </button>
        <button
          onClick={handleSaveGoals}
          disabled={isSaving || goals.length === 0}
        >
          {saveStatus || (isSaving ? t('goalsPage.savingButton', 'Saving...') : t('goalsPage.saveButton', 'Save'))}
        </button>
      </div>
    </div>
  );
};

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
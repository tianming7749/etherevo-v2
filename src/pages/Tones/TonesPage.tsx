// TonesPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useUserContext } from "../../context/UserContext";
import { saveUserPrompt } from "../../utils/supabaseHelpers"; // 假设从 supabaseHelpers 导入
import { supabase } from "../../supabaseClient";
import { generatePromptsForUser } from "../../utils/generatePrompts"; // 导入外部版本
import "./TonesPage.css";

interface Tone {
  id: string;
  tone_name_key: string;
  tone_description_key: string;
  prompt_template_key: string;
  prompt_template_default: string;
}

const TonesPage: React.FC = () => {
  const { userId } = useUserContext(); // 仅使用 userId
  const [tones, setTones] = useState<Tone[]>([]);
  const [selectedToneId, setSelectedToneId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // 用于初始加载
  const [loading, setLoading] = useState(false); // 保持 loading 用于保存时的加载状态
  const [error, setError] = useState<string | null>(null); // 添加错误状态
  const [saveStatus, setSaveStatus] = useState<string>(''); // 保存状态反馈
  const { t } = useTranslation();
  const navigate = useNavigate(); // 使用 useNavigate 钩子

  useEffect(() => {
    const fetchTonesAndUserSelection = async () => {
      if (!userId) {
        setIsLoading(false); // 如果没有 userId，直接结束加载状态
        setError(t('tonesPage.noLoginMessage', 'Please log in to set your tone.'));
        return;
      }

      setIsLoading(true); // 开始加载时设置 isLoading 为 true
      setError(null); // 重置错误状态
      try {
        const { data: tonesData, error: tonesError } = await supabase
          .from("tones_options")
          .select(`
            id,
            tone_name_key,
            tone_description_key,
            prompt_template_key,
            prompt_template_default
          `);
        if (tonesError) throw new Error(tonesError.message);
        setTones(tonesData as Tone[] || []);

        const { data: userToneData, error: userToneError } = await supabase
          .from("user_select_tones")
          .select("prompt_template_key")
          .eq("user_id", userId)
          .single();

        if (userToneError && userToneError.code !== "PGRST116") {
          throw new Error(userToneError.message);
        }

        if (userToneData) {
          const previouslySelectedTone = tonesData?.find(
            (tone: Tone) => tone.prompt_template_key === userToneData.prompt_template_key
          );
          if (previouslySelectedTone) {
            setSelectedToneId(previouslySelectedTone.id);
          }
        }
      } catch (error: any) {
        setError(error.message || t('tonesPage.fetchError', 'Failed to load tones. Please try again later.'));
      } finally {
        setIsLoading(false); // 加载完成，设置 isLoading 为 false
      }
    };

    fetchTonesAndUserSelection();
  }, [userId, t]); // 依赖项优化为 userId 和 t，确保仅在必要时触发

  const handleToneSelection = (id: string) => {
    setSelectedToneId(id);
  };

  const saveSelection = async () => {
    if (!userId) {
      alert(t('tonesPage.noLoginMessage', 'Please log in to set your tone.'));
      return;
    }

    if (!selectedToneId) {
      alert(t('tonesPage.toneSelectionAlert'));
      return;
    }

    setLoading(true);
    setSaveStatus(t('tonesPage.savingButton')); // 显示“Saving...”

    try {
      const selectedTone = tones.find((tone) => tone.id === selectedToneId);
      if (!selectedTone) throw new Error(t('tonesPage.noTonesMessage'));

      const { error: saveToneError } = await supabase.from("user_select_tones").upsert(
        {
          user_id: userId,
          prompt_template_key: selectedTone.prompt_template_key,
        },
        { onConflict: ["user_id"] }
      );
      if (saveToneError) throw new Error(`Save tone error: ${saveToneError.message}`);

      const updatedPrompt = await generatePromptsForUser(userId); // 使用外部版本
      if (updatedPrompt) {
        await saveUserPrompt(userId, updatedPrompt);
      } else {
        throw new Error("Prompt generation failed");
      }

      const { error: settingsError } = await supabase
        .from("user_settings")
        .update({ setup_completed: true })
        .eq("user_id", userId);
      if (settingsError) throw new Error(`Settings update error: ${settingsError.message}`);

      setSaveStatus(t('tonesPage.saveSuccessAlert')); // 显示“Saved!”
      setTimeout(() => {
        setSaveStatus(''); // 2秒后恢复为“Save”
        navigate('/settings/goals'); // 跳转到 Goals 页面
      }, 2000);
    } catch (error: any) {
      console.error(t('tonesPage.saveErrorLog'), error.message);
      setSaveStatus(t('tonesPage.saveErrorAlert')); // 显示保存失败提示
      setTimeout(() => setSaveStatus(''), 2000); // 2秒后清空
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (!userId) {
      alert(t('tonesPage.noLoginMessage', 'Please log in to set your tone.'));
      return;
    }

    navigate('/settings/goals'); // 直接跳转，无需显示“Skipping...”或“Skipped!”
  };

  if (isLoading) {
    return (
      <div className="loading-message" role="alert" aria-label={t('tonesPage.loadingMessage')}>
        {t('tonesPage.loadingMessage', 'Loading...')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message" role="alert" aria-label={t('tonesPage.errorMessagePrefix') + error}>
        {t('tonesPage.errorMessagePrefix') + error}
      </div>
    );
  }

  return (
    <div className="tones-page" role="main" aria-label={t('tonesPage.pageTitle')}>
      <h1 className="tones-title">{t('tonesPage.title')}</h1>
      <p>{t('tonesPage.descriptionLine1')}</p>
      <p>{t('tonesPage.descriptionLine2')}</p>
      {tones.length === 0 ? (
        <p className="no-tones-message">{t('tonesPage.noTonesMessage')}</p>
      ) : (
        <>
          <div className="tones-list" role="list">
            {tones.map((tone) => (
              <label 
                key={tone.id} 
                className={`tone-option ${selectedToneId === tone.id ? 'selected' : ''}`} 
                role="radio" 
                aria-checked={selectedToneId === tone.id}
                aria-label={t(`tonesPage.${tone.tone_name_key}`)}
              >
                <input
                  type="radio"
                  name="tone"
                  value={tone.id}
                  checked={selectedToneId === tone.id}
                  onChange={() => handleToneSelection(tone.id)}
                  disabled={loading}
                  aria-hidden="true" // 隐藏辅助技术直接访问原生输入框
                />
                <div className="tone-details">
                  <div className="tone-name">{t(`tonesPage.${tone.tone_name_key}`)}</div>
                  <div className="tone-description">{t(`tonesPage.${tone.tone_description_key}`)}</div>
                </div>
              </label>
            ))}
          </div>
          <div className="buttons-container">
            <button 
              onClick={handleSkip} 
              disabled={loading}
              aria-label={t('tonesPage.skipButton')}
            >
              {t('tonesPage.skipButton')}
            </button>
            <button 
              onClick={saveSelection} 
              disabled={loading}
              aria-label={t('tonesPage.saveButton')}
            >
              {saveStatus || (loading ? t('tonesPage.savingButton') : t('tonesPage.saveButton'))}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default TonesPage;
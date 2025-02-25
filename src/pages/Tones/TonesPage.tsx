import React, { useState, useEffect } from "react";
import i18next from 'i18next';
import { useUserContext } from "../../context/UserContext";
import { fetchUserTone, saveUserPrompt } from "../../utils/supabaseHelpers";
import { supabase } from "../../supabaseClient";
import { generatePromptsForUser } from "../../utils/generatePrompts"; // 导入外部版本
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom'; // 导入 useNavigate
import "./TonesPage.css";

interface Tone {
  id: string;
  tone_name_key: string;
  tone_description_key: string;
  prompt_template_key: string;
  prompt_template_default: string;
}

const TonesPage: React.FC = () => {
  const { userId } = useUserContext();
  const [tones, setTones] = useState<Tone[]>([]);
  const [selectedToneId, setSelectedToneId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const navigate = useNavigate(); // 使用 useNavigate 钩子

  useEffect(() => {
    const fetchTonesAndUserSelection = async () => {
      setLoading(true);
      setError(null);

      console.log("TonesPage useEffect - Start, current language:", i18next.language);

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

        if (userId) {
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
        }
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
        console.log("TonesPage useEffect - End, current language:", i18next.language);
      }
    };

    fetchTonesAndUserSelection();
  }, [userId]);

  const handleToneSelection = (id: string) => {
    setSelectedToneId(id);
  };

  const saveSelection = async () => {
    if (!selectedToneId) {
      alert(t('tonesPage.toneSelectionAlert'));
      return;
    }

    setLoading(true);
    try {
      const selectedTone = tones.find((tone) => tone.id === selectedToneId);
      if (!selectedTone) throw new Error(t('tonesPage.noTonesMessage'));

      console.log("Saving tone:", selectedTone);

      const { error: saveToneError } = await supabase.from("user_select_tones").upsert(
        {
          user_id: userId,
          prompt_template_key: selectedTone.prompt_template_key,
        },
        { onConflict: ["user_id"] }
      );
      if (saveToneError) throw new Error(`Save tone error: ${saveToneError.message}`);

      const updatedPrompt = await generatePromptsForUser(userId); // 使用外部版本
      console.log("Generated prompt:", updatedPrompt);
      if (updatedPrompt) {
        await saveUserPrompt(userId, updatedPrompt);
        console.log("提示词已更新并保存。");
      } else {
        throw new Error("Prompt generation failed");
      }

      const { error: settingsError } = await supabase
        .from("user_settings")
        .update({ setup_completed: true })
        .eq("user_id", userId);
      if (settingsError) throw new Error(`Settings update error: ${settingsError.message}`);

      alert(t('tonesPage.saveSuccessAlert'));
      navigate('/settings/goals'); // 保存成功后跳转到 Goals 页面
    } catch (error: any) {
      console.error(t('tonesPage.saveErrorLog'), error.message);
      alert(t('tonesPage.saveErrorAlert'));
    } finally {
      setLoading(false);
    }
  };

  if (error) return <div className="tones-page"><p>{t('tonesPage.errorMessagePrefix') + error}</p></div>;

  return (
    <div className="tones-page">
      <h1>{t('tonesPage.title')}</h1>
      <p>{t('tonesPage.descriptionLine1')}</p>
      <p>{t('tonesPage.descriptionLine2')}</p>
      {tones.length === 0 ? (
        <p>{t('tonesPage.noTonesMessage')}</p>
      ) : (
        <>
          <div className="tones-list">
            {tones.map((tone) => (
              <label key={tone.id} className="tone-option">
                <input
                  type="radio"
                  name="tone"
                  value={tone.id}
                  checked={selectedToneId === tone.id}
                  onChange={() => handleToneSelection(tone.id)}
                  disabled={loading}
                />
                <div className="tone-details">
                  <div className="tone-name">{t(`tonesPage.${tone.tone_name_key}`)}</div>
                  <div className="tone-description">{t(`tonesPage.${tone.tone_description_key}`)}</div>
                </div>
              </label>
            ))}
          </div>
          <button onClick={saveSelection} disabled={loading}>
            {loading ? t('tonesPage.savingButton') : t('tonesPage.saveButton')}
          </button>
        </>
      )}
    </div>
  );
};

export default TonesPage;
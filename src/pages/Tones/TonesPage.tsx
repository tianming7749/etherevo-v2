import React, { useState, useEffect } from "react";
import { useUserContext } from "../../context/UserContext";
import { fetchUserTone, saveUserPrompt } from "../../utils/supabaseHelpers";
import { supabase } from "../../supabaseClient";
import { generatePromptsForUser } from "../../utils/generatePrompts";
import "./TonesPage.css";

interface Tone {
  id: string;
  tone_name: string;
  tone_description: string;
  prompt_template: string;
}

const TonesPage: React.FC = () => {
  const { userId } = useUserContext();
  const [tones, setTones] = useState<Tone[]>([]);
  const [selectedToneId, setSelectedToneId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // 改为局部加载状态
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTonesAndUserSelection = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: tonesData, error: tonesError } = await supabase.from("tones_options").select("*");
        if (tonesError) throw new Error(tonesError.message);
        setTones(tonesData || []);

        if (userId) {
          const { data: userToneData, error: userToneError } = await supabase
            .from("user_select_tones")
            .select("prompt_template")
            .eq("user_id", userId)
            .single();

          if (userToneError && userToneError.code !== "PGRST116") {
            throw new Error(userToneError.message);
          }

          if (userToneData) {
            const previouslySelectedTone = tonesData?.find(
              (tone: Tone) => tone.prompt_template === userToneData.prompt_template
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
      }
    };

    fetchTonesAndUserSelection();
  }, [userId]);

  const handleToneSelection = (id: string) => {
    setSelectedToneId(id);
  };

  const saveSelection = async () => {
    if (!selectedToneId) {
      alert("请先选择一个 Tone！");
      return;
    }

    setLoading(true);
    try {
      const selectedTone = tones.find((tone) => tone.id === selectedToneId);
      if (!selectedTone) throw new Error("未找到选定的 Tone 信息。");

      const { error: saveToneError } = await supabase.from("user_select_tones").upsert(
        {
          user_id: userId,
          prompt_template: selectedTone.prompt_template,
        },
        { onConflict: ["user_id"] }
      );
      if (saveToneError) throw saveToneError;

      const updatedPrompt = await generatePromptsForUser(userId);
      if (updatedPrompt) {
        await saveUserPrompt(userId, updatedPrompt);
      } else {
        console.warn("提示词生成失败。");
      }

      await supabase
        .from("user_settings")
        .update({ setup_completed: true })
        .eq("user_id", userId);

      alert("保存成功！");
    } catch (error: any) {
      console.error("保存 Tone 出错：", error.message);
      alert("保存失败，请稍后重试！");
    } finally {
      setLoading(false);
    }
  };

  if (error) return <div className="tones-page"><p>Error: {error}</p></div>;

  return (
    <div className="tones-page">
      <h1>Select Your Tone</h1>
      <p>选择对话语气，定制专属对话体验</p>
      <p>根据您的当前状态和对话需求，选择最符合您心境的语气，EtherEvo 将以您选择的风格与您进行对话，提供更贴心、个性化的交流体验。</p>
      {tones.length === 0 ? (
        <p> </p>
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
                  disabled={loading} // 禁用按钮避免重复提交
                />
                <div className="tone-details">
                  <div className="tone-name">{tone.tone_name}</div>
                  <div className="tone-description">{tone.tone_description}</div>
                </div>
              </label>
            ))}
          </div>
          <button onClick={saveSelection} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </>
      )}
    </div>
  );
};

export default TonesPage;
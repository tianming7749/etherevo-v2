import React, { useState, useEffect } from "react";
import { generatePromptsForUser } from "../../../utils/generatePrompts";
import { useUserContext } from "../../../context/UserContext";
import { supabase } from "../../../supabaseClient";
import "./SocialSupportPage.css";
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom'; // 导入 useNavigate

const SocialSupportPage: React.FC = () => {
  const { userId } = useUserContext();
  const [socialSupport, setSocialSupport] = useState<any>({
    friends: "",
    family: "",
    meetFrequency: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate(); // 使用 useNavigate 钩子

  useEffect(() => {
    const fetchSocialSupport = async () => {
      if (!userId) return;

      const { data, error } = await supabase
        .from("user_social_support")
        .select("social_support")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          const { error: insertError } = await supabase
            .from("user_social_support")
            .insert({
              user_id: userId,
              social_support: {},
            });

          if (insertError) console.error("Error inserting default data:", insertError);
          else setSocialSupport({});
        } else {
          console.error("Error fetching social support:", error);
        }
      } else if (data && data.social_support) {
        setSocialSupport({
          friends: data.social_support.friends || "",
          family: data.social_support.family || "",
          meetFrequency: data.social_support.meetFrequency || "",
        });
      }
    };

    fetchSocialSupport();
  }, [userId]);

  const saveSocialSupport = async () => {
    if (!userId) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("user_social_support")
        .upsert(
          {
            user_id: userId,
            social_support: {
              friends: socialSupport.friends,
              family: socialSupport.family,
              meetFrequency: socialSupport.meetFrequency,
            },
          },
          { onConflict: "user_id" }
        );

      if (error) {
        console.error("Error saving social support:", error);
        alert(t('socialSupportPage.saveErrorAlert'));
        return;
      }

      const updatedPrompt = await generatePromptsForUser(userId);

      const { error: savePromptError } = await supabase
        .from("user_prompts_summary")
        .upsert({
          user_id: userId,
          full_prompt: updatedPrompt,
        }, { onConflict: ["user_id"] });

      if (savePromptError) {
        console.error("保存提示词失败：", savePromptError.message);
      } else {
        console.log("提示词已成功保存");
      }

      alert(t('socialSupportPage.saveSuccessAlert'));
      navigate('/settings/user-info/recent-events'); // 保存成功后跳转到 RecentEventsPage 页面
    } catch (error) {
      console.error("保存过程中发生错误：", error);
      alert(t('socialSupportPage.saveNetworkErrorAlert'));
    } finally {
      setIsSaving(false);
    }
  };

  const numberOptions = t('socialSupportPage.numberOptions', { returnObjects: true }) as Record<string, string>;
  const frequencyOptions = t('socialSupportPage.frequencyOptions', { returnObjects: true }) as Record<string, string>;

  return (
    <div className="social-support-container">
      <form>
        <h3>{t('socialSupportPage.socialNetworkSizeTitle')}</h3>
        <label>
          {t('socialSupportPage.friendsLabel')}
          <select
            value={socialSupport.friends || ""}
            onChange={(e) => setSocialSupport({ ...socialSupport, friends: e.target.value })}
          >
            <option value="">{t('socialSupportPage.selectOption')}</option>
            {Object.entries(numberOptions).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          {t('socialSupportPage.familyLabel')}
          <select
            value={socialSupport.family || ""}
            onChange={(e) => setSocialSupport({ ...socialSupport, family: e.target.value })}
          >
            <option value="">{t('socialSupportPage.selectOption')}</option>
            {Object.entries(numberOptions).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>
        </label>

        <h3>{t('socialSupportPage.socialContactFrequencyTitle')}</h3>
        <label>
          {t('socialSupportPage.meetFrequencyLabel')}
          <select
            value={socialSupport.meetFrequency || ""}
            onChange={(e) =>
              setSocialSupport({ ...socialSupport, meetFrequency: e.target.value })
            }
          >
            <option value="">{t('socialSupportPage.selectOption')}</option>
            {Object.entries(frequencyOptions).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>
        </label>

        <button type="button" onClick={saveSocialSupport} disabled={isSaving}>
          {isSaving ? t('socialSupportPage.savingButton') : t('socialSupportPage.saveButton')}
        </button>
      </form>
    </div>
  );
};

export default SocialSupportPage;
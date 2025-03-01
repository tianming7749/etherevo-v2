// SocialSupportPage.tsx
import React, { useState, useEffect } from "react";
import { generatePromptsForUser } from "../../../utils/generatePrompts";
import { useUserContext } from "../../../context/UserContext";
import { supabase } from "../../../supabaseClient";
import "./SocialSupportPage.css";
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom'; // 导入 useNavigate

const SocialSupportPage: React.FC = () => {
  const { userId } = useUserContext(); // 仅使用 userId
  const [socialSupport, setSocialSupport] = useState<any>({
    friends: "",
    family: "",
    meetFrequency: "",
  });
  const [isLoading, setIsLoading] = useState(true); // 用于初始加载
  const [isSaving, setIsSaving] = useState(false); // 用于保存时的加载状态
  const [error, setError] = useState<string | null>(null); // 添加错误状态
  const [saveStatus, setSaveStatus] = useState<string>(''); // 保存状态反馈
  const { t } = useTranslation();
  const navigate = useNavigate(); // 使用 useNavigate 钩子

  useEffect(() => {
    const fetchSocialSupport = async () => {
      if (!userId) {
        setIsLoading(false); // 如果没有 userId，直接结束加载状态
        setError(t('socialSupportPage.noLoginMessage', 'Please log in to set your social support.'));
        return;
      }

      setIsLoading(true); // 开始加载时设置 isLoading 为 true
      setError(null); // 重置错误状态
      try {
        const { data, error } = await supabase
          .from("user_social_support")
          .select("social_support")
          .eq("user_id", userId)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            console.log("No social support found, initializing with defaults.");
            const { error: insertError } = await supabase
              .from("user_social_support")
              .insert({
                user_id: userId,
                social_support: {},
              });

            if (insertError) {
              console.error("Error inserting default data:", insertError);
              setError(t('socialSupportPage.fetchError', 'Failed to load social support. Please try again later.'));
            } else {
              setSocialSupport({});
            }
          } else {
            console.error("Error fetching social support:", error);
            setError(t('socialSupportPage.fetchError', 'Failed to load social support. Please try again later.'));
          }
        } else if (data && data.social_support) {
          setSocialSupport({
            friends: data.social_support.friends || "",
            family: data.social_support.family || "",
            meetFrequency: data.social_support.meetFrequency || "",
          });
        }
      } catch (err) {
        console.error("Error loading social support:", err);
        setError(t('socialSupportPage.fetchError', 'Failed to load social support. Please try again later.'));
      } finally {
        setIsLoading(false); // 加载完成，设置 isLoading 为 false
      }
    };

    fetchSocialSupport();
  }, [userId, t]); // 依赖项优化为 userId 和 t，确保仅在必要时触发

  const saveSocialSupport = async () => {
    if (!userId) {
      alert(t('socialSupportPage.noLoginMessage', 'Please log in to set your social support.'));
      return;
    }

    setIsSaving(true); // 开始保存时设置 isSaving
    setSaveStatus(t('socialSupportPage.savingButton', 'Saving...')); // 显示“Saving...”

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
        setSaveStatus(t('socialSupportPage.saveErrorAlert')); // 显示保存失败提示
        setTimeout(() => setSaveStatus(''), 2000); // 2秒后清空
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
        setSaveStatus(t('socialSupportPage.saveNetworkErrorAlert')); // 显示网络错误提示
        setTimeout(() => setSaveStatus(''), 2000); // 2秒后清空
      } else {
        console.log("提示词已成功保存");
        setSaveStatus(t('socialSupportPage.saveSuccessAlert')); // 显示“Saved!”
        setTimeout(() => {
          setSaveStatus(''); // 2秒后恢复为“Save”
          navigate('/settings/user-info/recent-events'); // 保存成功后跳转到 RecentEventsPage 页面
        }, 2000);
      }
    } catch (error) {
      console.error("保存过程中发生错误：", error);
      setSaveStatus(t('socialSupportPage.saveNetworkErrorAlert')); // 显示网络错误提示
      setTimeout(() => setSaveStatus(''), 2000); // 2秒后清空
    } finally {
      setIsSaving(false); // 保存完成（无论成功或失败）重置 isSaving
    }
  };

  const handleSkip = () => {
    // 跳过当前页面，直接导航到下一个页面（RecentEvents）
    if (!userId) {
      alert(t('socialSupportPage.noLoginMessage', 'Please log in to set your social support.'));
      return;
    }
    navigate('/settings/user-info/recent-events'); // 直接跳转，无反馈
  };

  const numberOptions = t('socialSupportPage.numberOptions', { returnObjects: true }) as Record<string, string>;
  const frequencyOptions = t('socialSupportPage.frequencyOptions', { returnObjects: true }) as Record<string, string>;

  if (isLoading) {
    return <div className="loading-message">{t('socialSupportPage.loadingMessage', 'Loading...')}</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="social-support-container">
      <form>
        <h3>{t('socialSupportPage.socialNetworkSizeTitle')}</h3>
        <label>
          {t('socialSupportPage.friendsLabel')}
          <select
            value={socialSupport.friends || ""}
            onChange={(e) => setSocialSupport({ ...socialSupport, friends: e.target.value })}
            disabled={isSaving} // 使用 isSaving 禁用输入框
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
            disabled={isSaving} // 使用 isSaving 禁用输入框
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
            disabled={isSaving} // 使用 isSaving 禁用输入框
          >
            <option value="">{t('socialSupportPage.selectOption')}</option>
            {Object.entries(frequencyOptions).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>
        </label>

        <div className="buttons-container"> {/* 添加容器以并排放置按钮 */}
          <button type="button" onClick={handleSkip} disabled={isSaving}> {/* 仅在未登录时禁用 */}
            {t('socialSupportPage.skipButton')} {/* 保持原始文本，无状态反馈 */}
          </button>
          <button type="button" onClick={saveSocialSupport} disabled={isSaving}> {/* 使用 isSaving 禁用按钮 */}
            {saveStatus || (isSaving ? t('socialSupportPage.savingButton') : t('socialSupportPage.saveButton'))} {/* 动态显示保存状态 */}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SocialSupportPage;
// InterestsPage.tsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { supabase } from "../../../supabaseClient";
import { generatePromptsForUser } from "../../../utils/generatePrompts";  
import { useUserContext } from "../../../context/UserContext";
import "./InterestsPage.css";
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom'; // 导入 useNavigate

const InterestsPage: React.FC = () => {
  const { userId } = useUserContext(); // 仅使用 userId，不使用 loading，因为我们自定义 isLoading
  const [userInterests, setUserInterests] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true); // 用于初始加载
  const [isSaving, setIsSaving] = useState(false); // 用于保存时的加载状态
  const [error, setError] = useState<string | null>(null); // 添加错误状态
  const [saveStatus, setSaveStatus] = useState<string>(''); // 保存状态反馈
  const inputRefs = useRef<Record<string, HTMLInputElement>>({});
  const { t, i18n } = useTranslation(); // 添加 i18n 以检查当前语言
  const navigate = useNavigate(); // 使用 useNavigate 钩子

  // 使用 useMemo 缓存 interestsData 和 categoryKeys，避免不必要的重新计算
  const interestsData = useMemo(() => 
    t('interestsPage.categories', { returnObjects: true }) as Record<string, { title: string; options: Record<string, string> }>,
    [t]
  );
  const categoryKeys = useMemo(() => Object.keys(interestsData), [interestsData]);

  useEffect(() => {
    console.log("Current language:", i18n.language); // 调试当前语言
    const fetchInterests = async () => {
      if (!userId) {
        setIsLoading(false); // 如果没有 userId，直接结束加载状态
        setError(t('interestsPage.noLoginMessage', 'Please log in to set your interests.'));
        return;
      }

      setIsLoading(true); // 开始加载时设置 isLoading 为 true
      setError(null); // 重置错误状态
      try {
        const { data, error } = await supabase
          .from("user_interests")
          .select("interests")
          .eq("user_id", userId)
          .single();

        if (error) {
          if (error.code === "PGRST116") { // 记录不存在
            console.log("No interests found, initializing with defaults.");
            const defaultInterests: Record<string, string[]> = {};
            categoryKeys.forEach((categoryKey) => {
              defaultInterests[categoryKey] = [];
            });
            setUserInterests(defaultInterests);
          } else {
            console.error("Error fetching interests:", error);
            setError(t('interestsPage.fetchError', 'Failed to load interests. Please try again later.'));
          }
        } else if (data) {
          const savedInterests = JSON.parse(data.interests);
          const updatedInterests = { ...savedInterests };

          // 确保所有类别都初始化
          categoryKeys.forEach((categoryKey) => {
            if (!updatedInterests[categoryKey]) {
              updatedInterests[categoryKey] = [];
            }
          });

          setUserInterests(updatedInterests);
        }
      } catch (err) {
        console.error("Error loading interests:", err);
        setError(t('interestsPage.fetchError', 'Failed to load interests. Please try again later.'));
      } finally {
        setIsLoading(false); // 加载完成，设置 isLoading 为 false
      }
    };

    fetchInterests();
  }, [userId, categoryKeys, t, i18n.language]); // 增加 i18n.language 作为依赖，确保语言变化时重新加载

  const handleInterestChange = (category: string, interest: string, isChecked: boolean) => {
    const updatedCategory = userInterests[category] || [];
    const updatedInterests = isChecked
      ? [...new Set([...updatedCategory, interest])]
      : updatedCategory.filter((i) => i !== interest);

    setUserInterests((prev) => ({ ...prev, [category]: updatedInterests }));
  };

  const addUnsavedInputs = () => {
    const updatedInterests = { ...userInterests };

    Object.entries(inputRefs.current).forEach(([category, input]) => {
      const newInterest = input.value.trim();
      if (newInterest) {
        if (!updatedInterests[category]?.includes(newInterest)) {
          updatedInterests[category] = [...(updatedInterests[category] || []), newInterest];
        } else {
          console.warn("This interest already exists in the list!");
        }
      }
    });
    setUserInterests(updatedInterests);
  };

  // 使用 useCallback 包裹 saveInterests，防止不必要的重新创建
  const saveInterests = useCallback(async () => {
    if (!userId) {
      alert(t('interestsPage.noLoginMessage', 'Please log in to set your interests.'));
      return;
    }

    if (isSaving) return; // 防止重复调用

    addUnsavedInputs();

    setIsSaving(true);
    setSaveStatus(t('interestsPage.savingButton')); // 显示“Saving...”

    try {
      console.log('Saving interests (JSON):', JSON.stringify(userInterests));

      const { error } = await supabase
        .from("user_interests")
        .upsert(
          {
            user_id: userId,
            interests: JSON.stringify(userInterests),
          },
          { onConflict: "user_id" }
        );
  
      if (error) {
        console.error("Error saving interests:", error);
        setSaveStatus(t('interestsPage.saveErrorAlert')); // 显示保存失败提示
        setTimeout(() => setSaveStatus(''), 2000); // 2秒后清空
        return;
      }
  
      const updatedPrompt = await generatePromptsForUser(userId);
      console.log("Generated prompt:", updatedPrompt);

      const { error: savePromptError } = await supabase
        .from("user_prompts_summary")
        .upsert({
          user_id: userId,
          full_prompt: updatedPrompt,
        }, { onConflict: ["user_id"] });

      if (savePromptError) {
        console.error("保存提示词失败：", savePromptError.message);
        setSaveStatus(t('interestsPage.saveNetworkErrorAlert')); // 显示网络错误提示
        setTimeout(() => setSaveStatus(''), 2000); // 2秒后清空
      } else {
        console.log("提示词已成功保存");
        setSaveStatus(t('interestsPage.saveSuccessAlert')); // 显示“Saved!”
        setTimeout(() => {
          setSaveStatus(''); // 2秒后恢复为“Save”
          navigate('/settings/user-info/social-support'); // 保存成功后跳转到 SocialSupportPage 页面
        }, 2000);
      }

      Object.values(inputRefs.current).forEach(input => input.value = "");

      const { data: checkData, error: checkError } = await supabase
        .from("user_interests")
        .select("interests")
        .eq("user_id", userId)
        .single();

      if (checkError) {
        console.error("Error checking saved data:", checkError);
      } else {
        console.log("Saved data verified:", checkData);
      }
    } catch (error) {
      console.error("Error during save process:", error);
      setSaveStatus(t('interestsPage.saveNetworkErrorAlert')); // 显示网络错误提示
      setTimeout(() => setSaveStatus(''), 2000); // 2秒后清空
    } finally {
      setIsSaving(false);
    }
  }, [userId, userInterests, t, navigate]); // 依赖项包括 userId、userInterests、t 和 navigate

  const handleSkip = () => {
    // 跳过当前页面，直接导航到下一个页面（SocialSupport）
    if (!userId) {
      alert(t('interestsPage.noLoginMessage', 'Please log in to set your interests.'));
      return;
    }
    navigate('/settings/user-info/social-support'); // 直接跳转，无反馈
  };

  if (isLoading) {
    return (
      <div className="loading-message" role="alert" aria-label={t('interestsPage.loadingMessage')}>
        {t('interestsPage.loadingMessage', 'Loading...')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message" role="alert" aria-label={error}>
        {error}
      </div>
    );
  }

  return (
    <div className="interests-page" role="form" aria-label={t('interestsPage.pageTitle')}>
      <div className="interests-grid" role="list">
        {categoryKeys.map((categoryKey) => (
          <div key={categoryKey} className="interest-category" role="listitem" aria-label={interestsData[categoryKey].title}>
            <h3 className="category-title">{interestsData[categoryKey].title}</h3>
            <ul className="interests-list">
              {Object.entries(interestsData[categoryKey].options).map(([interestKey, interestValue]) => (
                <li key={interestKey} className="interest-item">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={userInterests[categoryKey]?.includes(interestKey) || false}
                      onChange={(e) => handleInterestChange(categoryKey, interestKey, e.target.checked)}
                      disabled={isSaving} // 使用 isSaving 禁用输入框
                      aria-label={interestValue}
                    />
                    {interestValue}
                  </label>
                </li>
              ))}
              {userInterests[categoryKey]
                ?.filter((interest) => !Object.keys(interestsData[categoryKey].options).includes(interest))
                .map((extraInterest) => (
                  <li key={extraInterest} className="interest-item">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked
                        onChange={(e) => handleInterestChange(categoryKey, extraInterest, e.target.checked)}
                        disabled={isSaving} // 使用 isSaving 禁用输入框
                        aria-label={extraInterest}
                      />
                      {extraInterest}
                    </label>
                  </li>
                ))}
            </ul>
            <input
              type="text"
              placeholder={t('interestsPage.addInterestPlaceholder')}
              ref={(el) => (el ? (inputRefs.current[categoryKey] = el) : delete inputRefs.current[categoryKey])}
              disabled={isSaving} // 使用 isSaving 禁用输入框
              className="interest-input"
              aria-label={t('interestsPage.addInterestPlaceholderLabel')}
            />
          </div>
        ))}
      </div>
      <div className="buttons-container">
        <button 
          onClick={handleSkip} 
          disabled={isSaving}
          aria-label={t('interestsPage.skipButton')}
        >
          {t('interestsPage.skipButton', 'Skip')}
        </button>
        <button 
          onClick={saveInterests} 
          disabled={isSaving}
          aria-label={t('interestsPage.saveButton')}
        >
          {saveStatus || (isSaving ? t('interestsPage.savingButton', 'Saving...') : t('interestsPage.saveButton', 'Save'))}
        </button>
      </div>
    </div>
  );
};

export default InterestsPage;
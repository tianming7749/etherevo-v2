// BasicInfo.tsx
import React, { useState, useEffect } from "react";
import { saveBasicInfo } from "../../../api/userInfo";
import { supabase } from "../../../supabaseClient";
import { generatePromptsForUser } from "../../../utils/generatePrompts";
import NameInput from "./NameInput";
import AgeSelector from "./AgeSelector";
import GenderSelector from "./GenderSelector";
import OccupationSelector from "./OccupationSelector";
import "./BasicInfo.css";
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom'; // 导入 useNavigate
import { useUserContext } from "../../../context/UserContext"; // 确保导入 useUserContext

const BasicInfo: React.FC = () => {
  const { userId: contextUserId, loading: contextLoading } = useUserContext(); // 从 UserContext 获取 userId 和 loading
  const [basicInfo, setBasicInfo] = useState({
    name: "",
    age_group: "",
    gender: "",
    gender_other: "",
    occupation: "",
    occupation_other: "",
  });

  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // 用于初始加载
  const [isSaving, setIsSaving] = useState(false); // 用于保存时的加载状态
  const [saveStatus, setSaveStatus] = useState<string>(''); // 保存状态反馈
  const { t } = useTranslation();
  const navigate = useNavigate(); // 使用 useNavigate 钩子

  useEffect(() => {
    const fetchUserId = async () => {
      // 优先使用 UserContext 中的 userId
      if (contextUserId) {
        setUserId(contextUserId);
        setIsLoading(false);
        return;
      }

      // 如果 UserContext 中的 userId 为空，从 Supabase 获取
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error.message);
        setUserId(null);
      } else {
        setUserId(data?.user?.id || null);
      }
      setIsLoading(false);
    };

    fetchUserId();
  }, [contextUserId]); // 依赖于 contextUserId，确保 UserContext 的 userId 变化时更新

  useEffect(() => {
    const fetchBasicInfo = async () => {
      if (!userId) return;

      setIsLoading(true); // 开始加载数据
      try {
        const { data, error } = await supabase
          .from("user_basic_info")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (error) {
          console.error("Error fetching basic info:", error.message);
        } else if (data) {
          setBasicInfo({
            name: data.name || "",
            age_group: data.age_group || "",
            gender: data.gender || "",
            gender_other: data.gender_other || "",
            occupation: data.occupation || "",
            occupation_other: data.occupation_other || "",
          });
        }
      } catch (err) {
        console.error("Error loading basic info:", err);
      } finally {
        setIsLoading(false); // 加载完成
      }
    };

    if (userId) {
      fetchBasicInfo();
    }
  }, [userId]);

  const handleFieldChange = (field: string, value: string) => {
    setBasicInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!userId) {
      alert(t('basicInfoPage.noLoginMessage', 'Please log in to set your basic information.')); // 保持未登录提示
      return;
    }

    setIsSaving(true); // 开始保存时设置 isSaving
    setSaveStatus(t('basicInfoPage.savingButton', 'Saving...')); // 显示“Saving...”

    try {
      // 保存到 user_basic_info 表（使用键）
      const result = await saveBasicInfo({ ...basicInfo, user_id: userId });
      if (!result.success) {
        setSaveStatus(t('basicInfoPage.saveFailedAlert')); // 显示保存失败提示
        setTimeout(() => setSaveStatus(''), 2000); // 2秒后清空
        return;
      }

      // 生成翻译后的基本信息
      const ageOptions = t('ageSelector.options', { returnObjects: true }) as Record<string, string>;
      const genderOptions = t('genderSelector.options', { returnObjects: true }) as Record<string, string>;
      const occupationOptions = t('occupationSelector.options', { returnObjects: true }) as Record<string, string>;

      const translatedBasicInfo = {
        name: basicInfo.name || t('prompts.notProvided'),
        age_group: ageOptions[basicInfo.age_group] || t('prompts.notProvided'),
        gender: basicInfo.gender === "other" ? (basicInfo.gender_other || t('prompts.notProvided')) : (genderOptions[basicInfo.gender] || t('prompts.notProvided')),
        occupation: basicInfo.occupation === "other" ? (basicInfo.occupation_other || t('prompts.notProvided')) : (occupationOptions[basicInfo.occupation] || t('prompts.notProvided')),
      };

      // 生成提示词
      const updatedPrompt = await generatePromptsForUser(userId);

      // 保存翻译后的提示词到 user_prompts_summary
      const { error: savePromptError } = await supabase
        .from("user_prompts_summary")
        .upsert({
          user_id: userId,
          full_prompt: updatedPrompt,
          basic_info: `
            ${t('prompts.name')} ${translatedBasicInfo.name},
            ${t('prompts.ageGroup')} ${translatedBasicInfo.age_group},
            ${t('prompts.gender')} ${translatedBasicInfo.gender},
            ${t('prompts.occupation')} ${translatedBasicInfo.occupation}
          `.trim(),
        }, { onConflict: ["user_id"] });

      if (savePromptError) {
        console.error("保存提示词失败：", savePromptError.message);
        setSaveStatus(t('basicInfoPage.saveErrorAlert')); // 显示网络错误提示
        setTimeout(() => setSaveStatus(''), 2000); // 2秒后清空
      } else {
        console.log("提示词已成功保存");
        setSaveStatus(t('basicInfoPage.saveSuccessAlert')); // 显示“Saved!”
        setTimeout(() => {
          setSaveStatus(''); // 2秒后恢复为“Save”
          navigate('/settings/user-info/environment'); // 跳转到 LifeEnvironment 页面
        }, 2000);
      }
    } catch (error) {
      console.error("保存失败：", error);
      setSaveStatus(t('basicInfoPage.saveErrorAlert')); // 显示网络错误提示
      setTimeout(() => setSaveStatus(''), 2000); // 2秒后清空
    } finally {
      setIsSaving(false); // 保存完成（无论成功或失败）重置 isSaving
    }
  };

  const handleSkip = () => {
    // 跳过当前页面，直接导航到下一个页面（LifeEnvironment）
    if (!userId) {
      alert(t('basicInfoPage.noLoginMessage', 'Please log in to set your basic information.')); // 保持未登录提示
      return;
    }
    navigate('/settings/user-info/environment'); // 直接跳转，无反馈
  };

  if (isLoading || contextLoading) {
    return (
      <div className="loading-message" role="alert" aria-label={t('basicInfoPage.loadingMessage')}>
        {t('basicInfoPage.loadingMessage', 'Loading...')}
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="error-message" role="alert" aria-label={t('basicInfoPage.noLoginMessage')}>
        {t('basicInfoPage.noLoginMessage', 'Please log in to set your basic information.')}
      </div>
    );
  }

  return (
    <div className="basic-info-container" role="form" aria-label={t('basicInfoPage.pageTitle')}>
      <NameInput value={basicInfo.name} onChange={(value) => handleFieldChange("name", value)} />
      <AgeSelector value={basicInfo.age_group} onChange={(value) => handleFieldChange("age_group", value)} />
      <GenderSelector
        value={basicInfo.gender}
        otherValue={basicInfo.gender_other}
        onChange={(field, value) => handleFieldChange(field, value)}
        onOtherChange={(value) => handleFieldChange("gender_other", value)}
      />
      <OccupationSelector
        value={basicInfo.occupation}
        otherValue={basicInfo.occupation_other}
        onChange={(field, value) => handleFieldChange(field, value)}
        onOtherChange={(value) => handleFieldChange("occupation_other", value)}
      />
      <div className="buttons-container">
        <button 
          onClick={handleSkip} 
          disabled={isSaving}
          aria-label={t('basicInfoPage.skipButton')}
        >
          {t('basicInfoPage.skipButton', 'Skip')}
        </button>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          aria-label={t('basicInfoPage.saveButton')}
        >
          {saveStatus || (isSaving ? t('basicInfoPage.savingButton', 'Saving...') : t('basicInfoPage.saveButton', 'Save'))}
        </button>
      </div>
    </div>
  );
};

export default BasicInfo;
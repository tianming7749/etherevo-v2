// LifeEnvironment.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { generatePromptsForUser } from "../../../utils/generatePrompts";
import StressLevelSelector from "./StressLevelSelector";
import RelationshipStressSelector from "./RelationshipStressSelector";
import FinancialStressSelector from "./FinancialStressSelector";
import HealthStatusSelector from "./HealthStatusSelector";
import AdditionalDetailsInput from "./AdditionalDetailsInput";
import "./LifeEnvironment.css";
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom'; // 导入 useNavigate

interface LifeEnvironmentData {
  stress_level: string;
  relationship_stress: string[];
  financial_stress: string;
  sleep_quality: string;
  additional_details: string;
}

const defaultData: LifeEnvironmentData = {
  stress_level: "",
  relationship_stress: [],
  financial_stress: "",
  sleep_quality: "",
  additional_details: "",
};

const getCurrentUser = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error("获取用户会话时出错：", error);
    return null;
  }
  if (!session || !session.user) {
    console.warn("用户会话无效或未登录");
    return null;
  }
  return session.user;
};

const LifeEnvironment: React.FC = () => {
  const [formData, setFormData] = useState<LifeEnvironmentData>(defaultData);
  const [isLoading, setIsLoading] = useState(true); // 用于初始加载
  const [isSaving, setIsSaving] = useState(false); // 用于保存时的加载状态
  const [saveStatus, setSaveStatus] = useState<string>(''); // 保存状态反馈
  const { t } = useTranslation();
  const navigate = useNavigate(); // 使用 useNavigate 钩子

  useEffect(() => {
    const fetchLatestData = async () => {
      const user = await getCurrentUser();
      if (!user) {
        setIsLoading(false); // 如果没有用户，直接结束加载状态
        return; // 不显示弹窗，直接返回空表单
      }

      setIsLoading(true); // 开始加载时设置 isLoading 为 true
      try {
        const { data, error } = await supabase
          .from("life_environment")
          .select("stress_level, relationship_stress, financial_stress, sleep_quality, additional_details")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) {
          console.error("获取生活环境数据时出错：", error);
        } else if (data && data.length > 0) {
          setFormData({
            stress_level: data[0].stress_level || "",
            relationship_stress: data[0].relationship_stress || [],
            financial_stress: data[0].financial_stress || "",
            sleep_quality: data[0].sleep_quality || "",
            additional_details: data[0].additional_details || "",
          });
        }
      } catch (err) {
        console.error("加载生活环境数据时出错：", err);
      } finally {
        setIsLoading(false); // 加载完成
      }
    };

    fetchLatestData();
  }, [t]);

  const handleChange = (field: keyof LifeEnvironmentData, value: any) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  const handleSaveToSupabase = async () => {
    const user = await getCurrentUser();
    if (!user) {
      alert(t('lifeEnvironmentPage.noLoginAlert')); // 保持未登录提示
      return;
    }

    setIsSaving(true); // 开始保存时设置 isSaving
    setSaveStatus(t('lifeEnvironmentPage.savingButton')); // 显示“Saving...”

    try {
      const { error } = await supabase.from("life_environment").upsert([
        {
          user_id: user.id,
          stress_level: formData.stress_level,
          relationship_stress: formData.relationship_stress,
          financial_stress: formData.financial_stress,
          sleep_quality: formData.sleep_quality,
          additional_details: formData.additional_details,
        },
      ], {
        onConflict: 'user_id'
      });

      if (error) {
        console.error("保存数据时出错：", error);
        setSaveStatus(t('lifeEnvironmentPage.saveErrorAlert')); // 显示保存失败提示
        setTimeout(() => setSaveStatus(''), 2000); // 2秒后清空
        return;
      }

      const updatedPrompt = await generatePromptsForUser(user.id);

      const { error: savePromptError } = await supabase
        .from("user_prompts_summary")
        .upsert({
          user_id: user.id,
          full_prompt: updatedPrompt,
        }, { onConflict: ["user_id"] });

      if (savePromptError) {
        console.error("保存提示词失败：", savePromptError.message);
        setSaveStatus(t('lifeEnvironmentPage.saveErrorAlert')); // 显示网络错误提示
        setTimeout(() => setSaveStatus(''), 2000); // 2秒后清空
      } else {
        console.log("提示词已成功保存");
        setSaveStatus(t('lifeEnvironmentPage.saveSuccessAlert')); // 显示“Saved!”
        setTimeout(() => {
          setSaveStatus(''); // 2秒后恢复为“Save”
          navigate('/settings/user-info/health-condition'); // 跳转到 HealthCondition 页面
        }, 2000);
      }
    } catch (error) {
      console.error("保存过程中发生错误：", error);
      setSaveStatus(t('lifeEnvironmentPage.saveErrorAlert')); // 显示网络错误提示
      setTimeout(() => setSaveStatus(''), 2000); // 2秒后清空
    } finally {
      setIsSaving(false); // 保存完成（无论成功或失败）重置 isSaving
    }
  };

  const handleSkip = async () => { // 修改为 async 函数以支持 await
    // 跳过当前页面，直接导航到下一个页面（HealthCondition）
    const user = await getCurrentUser();
    if (!user) {
      alert(t('lifeEnvironmentPage.noLoginAlert')); // 保持未登录提示
      return;
    }
    navigate('/settings/user-info/health-condition'); // 直接跳转，无反馈
  };

  if (isLoading) {
    return (
      <div className="loading-message" role="alert" aria-label={t('lifeEnvironmentPage.loadingMessage')}>
        {t('lifeEnvironmentPage.loadingMessage', 'Loading...')}
      </div>
    );
  }

  return (
    <div className="life-environment" role="form" aria-label={t('lifeEnvironmentPage.pageTitle')}>
      <StressLevelSelector
        value={formData.stress_level}
        onChange={(value) => handleChange("stress_level", value)}
      />
      <RelationshipStressSelector
        value={formData.relationship_stress}
        onChange={(value) => handleChange("relationship_stress", value)}
      />
      <FinancialStressSelector
        value={formData.financial_stress}
        onChange={(value) => handleChange("financial_stress", value)}
      />
      <HealthStatusSelector
        sleepQuality={formData.sleep_quality}
        onChange={(field, value) => handleChange(field, value)} 
      />
      <AdditionalDetailsInput
        value={formData.additional_details}
        onChange={(value) => handleChange("additional_details", value)}
      />
      <div className="buttons-container">
        <button 
          onClick={handleSkip} 
          disabled={isSaving}
          aria-label={t('lifeEnvironmentPage.skipButton')}
        >
          {t('lifeEnvironmentPage.skipButton', 'Skip')}
        </button>
        <button 
          onClick={handleSaveToSupabase}
          disabled={isSaving}
          aria-label={t('lifeEnvironmentPage.saveButton')}
        >
          {saveStatus || (isSaving ? t('lifeEnvironmentPage.savingButton', 'Saving...') : t('lifeEnvironmentPage.saveButton', 'Save'))}
        </button>
      </div>
    </div>
  );
};

export default LifeEnvironment;
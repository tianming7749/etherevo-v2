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
  if (error || !session) {
    console.error("获取用户会话时出错：", error);
    return null;
  }
  return session.user;
};

const LifeEnvironment: React.FC = () => {
  const [formData, setFormData] = useState<LifeEnvironmentData>(defaultData);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchLatestData = async () => {
      const user = await getCurrentUser();
      if (!user) {
        alert(t('lifeEnvironmentPage.noLoginAlert'));
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("life_environment")
        .select("stress_level, relationship_stress, financial_stress, sleep_quality, additional_details")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("获取生活环境数据时出错：", error);
        alert(t('lifeEnvironmentPage.loadErrorAlert'));
      } else if (data && data.length > 0) {
        setFormData({
          stress_level: data[0].stress_level || "",
          relationship_stress: data[0].relationship_stress || [],
          financial_stress: data[0].financial_stress || "",
          sleep_quality: data[0].sleep_quality || "",
          additional_details: data[0].additional_details || "",
        });
      }

      setIsLoading(false);
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
    try {
      setIsSaving(true);
      const user = await getCurrentUser();
      if (!user) {
        alert(t('lifeEnvironmentPage.noLoginAlert'));
        return;
      }

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
        alert(t('lifeEnvironmentPage.saveErrorAlert'));
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
      } else {
        console.log("提示词已成功保存");
      }

      alert(t('lifeEnvironmentPage.saveSuccessAlert'));
    } catch (error) {
      console.error("保存过程中发生错误：", error);
      alert(t('lifeEnvironmentPage.saveErrorAlert'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="life-environment">
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
      <button
        onClick={handleSaveToSupabase}
        disabled={isSaving}
        className="save-button"
      >
        {isSaving ? t('lifeEnvironmentPage.savingButton') : t('lifeEnvironmentPage.saveButton')}
      </button>
    </div>
  );
};

export default LifeEnvironment;
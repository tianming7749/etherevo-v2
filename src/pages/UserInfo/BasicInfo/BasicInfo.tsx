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

const BasicInfo: React.FC = () => {
  const [basicInfo, setBasicInfo] = useState({
    name: "",
    age_group: "",
    gender: "",
    gender_other: "",
    occupation: "",
    occupation_other: "",
  });

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // 更名为 loading，与 HealthConditionPage 一致
  const { t } = useTranslation();
  const navigate = useNavigate(); // 使用 useNavigate 钩子

  useEffect(() => {
    const fetchUserId = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error.message);
      } else {
        setUserId(data?.user?.id || null);
      }
    };

    fetchUserId();
  }, []);

  useEffect(() => {
    const fetchBasicInfo = async () => {
      if (!userId) return;

      setLoading(true); // 使用 loading 状态
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
        setLoading(false); // 确保加载状态在完成时重置
      }
    };

    fetchBasicInfo();
  }, [userId]);

  const handleFieldChange = (field: string, value: string) => {
    setBasicInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!userId) return; // 直接返回，无需弹出提示，与 HealthConditionPage 一致

    setLoading(true); // 开始保存时设置加载状态

    try {
      // 保存到 user_basic_info 表（使用键）
      const result = await saveBasicInfo({ ...basicInfo, user_id: userId });
      if (!result.success) {
        alert(t('basicInfoPage.saveFailedAlert')); // 保持失败提示
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
      } else {
        console.log("提示词已成功保存");
      }

      alert(t('basicInfoPage.saveSuccessAlert')); // 保持成功提示
      navigate('/settings/user-info/environment'); // 保存成功后跳转到 LifeEnvironment 页面
    } catch (error) {
      console.error("保存失败：", error);
      alert(t('basicInfoPage.saveErrorAlert')); // 保持网络错误提示
    } finally {
      setLoading(false); // 保存完成（无论成功或失败）重置加载状态
    }
  };

  return (
    <div className="basic-info-container">
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
      <button onClick={handleSave} disabled={loading}> {/* 使用 loading 控制禁用状态 */}
        {loading ? t('basicInfoPage.savingButton') : t('basicInfoPage.saveButton')} {/* 动态显示保存文本 */}
      </button>
    </div>
  );
};

export default BasicInfo;
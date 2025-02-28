// HealthConditionPage.tsx
import React, { useEffect, useState } from "react";
import { saveBasicInfo } from "../../../api/userInfo";
import { generatePromptsForUser } from "../../../utils/generatePrompts";
import { useUserContext } from "../../../context/UserContext";
import { supabase } from "../../../supabaseClient";
import "./HealthConditionPage.css";
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom'; // 导入 useNavigate

const HealthConditionPage = () => {
  const { userId } = useUserContext();
  const [healthCondition, setHealthCondition] = useState({
    mentalHealthHistory: [] as string[],
    isReceivingTreatment: false,
  });

  const [isLoading, setIsLoading] = useState(true); // 用于初始加载
  const [isSaving, setIsSaving] = useState(false); // 用于保存时的加载状态
  const [saveStatus, setSaveStatus] = useState<string>(''); // 保存状态反馈
  const { t } = useTranslation();
  const navigate = useNavigate(); // 使用 useNavigate 钩子

  const options = {
    mentalHealthHistory: t('healthConditionPage.mentalHealthOptions', { returnObjects: true }) as Record<string, string>,
  };
  const mentalHealthKeys = Object.keys(options.mentalHealthHistory);

  useEffect(() => {
    const fetchHealthCondition = async () => {
      if (!userId) {
        setIsLoading(false); // 如果没有 userId，直接结束加载状态
        return;
      }

      setIsLoading(true); // 开始加载时设置 isLoading 为 true
      try {
        const { data, error } = await supabase
          .from("user_health_condition")
          .select("health_condition")
          .eq("user_id", userId)
          .single();

        if (data && data.health_condition) {
          setHealthCondition({
            mentalHealthHistory: data.health_condition.mentalHealthHistory || [],
            isReceivingTreatment: data.health_condition.isReceivingTreatment || false,
          });
        } else if (error) {
          console.error("Error fetching health condition:", error);
        }
      } catch (err) {
        console.error("Error loading health condition:", err);
      } finally {
        setIsLoading(false); // 加载完成，设置 isLoading 为 false
      }
    };

    fetchHealthCondition();
  }, [userId]);

  const saveHealthCondition = async () => {
    if (!userId) {
      alert(t('healthConditionPage.noLoginMessage', 'Please log in to set your health condition.')); // 保持未登录提示
      return;
    }

    setIsSaving(true); // 开始保存时设置 isSaving
    setSaveStatus(t('healthConditionPage.savingButton', 'Saving...')); // 显示“Saving...”

    try {
      const { error } = await supabase
        .from("user_health_condition")
        .upsert({
          user_id: userId,
          health_condition: {
            mentalHealthHistory: healthCondition.mentalHealthHistory,
            isReceivingTreatment: healthCondition.isReceivingTreatment,
          },
        });

      if (error) {
        console.error("Error saving health condition:", error);
        setSaveStatus(t('healthConditionPage.saveErrorAlert')); // 显示保存失败提示
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
        setSaveStatus(t('healthConditionPage.saveErrorAlert')); // 显示网络错误提示
        setTimeout(() => setSaveStatus(''), 2000); // 2秒后清空
      } else {
        console.log("提示词已成功保存");
        setSaveStatus(t('healthConditionPage.saveSuccessAlert')); // 显示“Saved!”
        setTimeout(() => {
          setSaveStatus(''); // 2秒后恢复为“Save”
          navigate('/settings/user-info/interests'); // 保存成功后跳转到 Interests 页面
        }, 2000);
      }
    } catch (error) {
      console.error("保存过程中发生错误：", error);
      setSaveStatus(t('healthConditionPage.saveNetworkErrorAlert')); // 显示网络错误提示
      setTimeout(() => setSaveStatus(''), 2000); // 2秒后清空
    } finally {
      setIsSaving(false); // 保存完成（无论成功或失败）重置 isSaving
    }
  };

  const handleChange = (field: string, value: any) => {
    setHealthCondition((prev) => ({ ...prev, [field]: value }));
  };

  const handleSkip = () => {
    // 跳过当前页面，直接导航到下一个页面（Interests）
    if (!userId) {
      alert(t('healthConditionPage.noLoginMessage', 'Please log in to set your health condition.')); // 保持未登录提示
      return;
    }
    navigate('/settings/user-info/interests'); // 直接跳转，无反馈
  };

  if (isLoading) {
    return <div className="loading-message">{t('healthConditionPage.loadingMessage', 'Loading...')}</div>;
  }

  return (
    <div className="health-condition-container">
      <form>
        <h3>{t('healthConditionPage.mentalHealthHistoryTitle')}</h3>
        <div>
          {mentalHealthKeys.map((key) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={healthCondition.mentalHealthHistory.includes(key)}
                onChange={(e) => {
                  const updatedList = e.target.checked
                    ? [...healthCondition.mentalHealthHistory, key]
                    : healthCondition.mentalHealthHistory.filter((item) => item !== key);
                  handleChange("mentalHealthHistory", updatedList);
                }}
                disabled={isSaving} // 使用 isSaving 禁用输入框
              />
              {options.mentalHealthHistory[key]}
            </label>
          ))}
          <div>
            <label>
              {t('healthConditionPage.otherSpecify')}
              <input
                type="text"
                value={
                  healthCondition.mentalHealthHistory.find((item) =>
                    item.startsWith("other:")
                  )?.replace("other:", "") || ""
                }
                onChange={(e) => {
                  const othersText = `other:${e.target.value}`;
                  const updatedList = healthCondition.mentalHealthHistory.filter(
                    (item) => !item.startsWith("other:")
                  );
                  if (e.target.value.trim()) updatedList.push(othersText);
                  handleChange("mentalHealthHistory", updatedList);
                }}
                disabled={isSaving} // 使用 isSaving 禁用输入框
              />
            </label>
          </div>
        </div>

        <h3>{t('healthConditionPage.treatmentQuestion')}</h3>
        <label>
          <input
            type="radio"
            checked={healthCondition.isReceivingTreatment === true}
            onChange={() => handleChange("isReceivingTreatment", true)}
            disabled={isSaving} // 使用 isSaving 禁用输入框
          />
          {t('healthConditionPage.yes')}
        </label>
        <label>
          <input
            type="radio"
            checked={healthCondition.isReceivingTreatment === false}
            onChange={() => handleChange("isReceivingTreatment", false)}
            disabled={isSaving} // 使用 isSaving 禁用输入框
          />
          {t('healthConditionPage.no')}
        </label>

        <div className="buttons-container"> {/* 添加容器以并排放置按钮 */}
          <button type="button" onClick={handleSkip} disabled={isSaving}> {/* 使用 isSaving 禁用按钮 */}
            {t('healthConditionPage.skipButton')} {/* 保持原始文本，无状态反馈 */}
          </button>
          <button type="button" onClick={saveHealthCondition} disabled={isSaving}> {/* 使用 isSaving 禁用按钮 */}
            {saveStatus || (isSaving ? t('healthConditionPage.savingButton', 'Saving...') : t('healthConditionPage.saveButton', 'Save'))} {/* 动态显示保存状态 */}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HealthConditionPage;
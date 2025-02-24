import React, { useEffect, useState } from "react";
import { saveBasicInfo } from "../../../api/userInfo";
import { generatePromptsForUser } from "../../../utils/generatePrompts";
import { useUserContext } from "../../../context/UserContext";
import { supabase } from "../../../supabaseClient";
import "./HealthConditionPage.css";
import { useTranslation } from 'react-i18next';

const HealthConditionPage = () => {
  const { userId } = useUserContext();
  const [healthCondition, setHealthCondition] = useState({
    mentalHealthHistory: [],
    isReceivingTreatment: false,
  });

  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const options = {
    mentalHealthHistory: t('healthConditionPage.mentalHealthOptions', { returnObjects: true }) as Record<string, string>,
  };
  const mentalHealthKeys = Object.keys(options.mentalHealthHistory);

  useEffect(() => {
    const fetchHealthCondition = async () => {
      if (!userId) return;
      setLoading(true);
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
      setLoading(false);
    };

    fetchHealthCondition();
  }, [userId]);

  const saveHealthCondition = async () => {
    if (!userId) return;

    setLoading(true);

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
        alert(t('healthConditionPage.saveErrorAlert'));
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

      alert(t('healthConditionPage.saveSuccessAlert'));
    } catch (error) {
      console.error("保存过程中发生错误：", error);
      alert(t('healthConditionPage.saveNetworkErrorAlert'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setHealthCondition((prev) => ({ ...prev, [field]: value }));
  };

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
          />
          {t('healthConditionPage.yes')}
        </label>
        <label>
          <input
            type="radio"
            checked={healthCondition.isReceivingTreatment === false}
            onChange={() => handleChange("isReceivingTreatment", false)}
          />
          {t('healthConditionPage.no')}
        </label>

        <button type="button" onClick={saveHealthCondition} disabled={loading}>
          {t('healthConditionPage.saveButton')}
        </button>
      </form>
    </div>
  );
};

export default HealthConditionPage;
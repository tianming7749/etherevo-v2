import React, { useEffect, useState } from "react";
import { saveBasicInfo } from "../../../api/userInfo";
import { generatePromptsForUser } from "../../../utils/generatePrompts";  // 引入生成提示词的功能
import { useUserContext } from "../../../context/UserContext";
import { supabase } from "../../../supabaseClient";
import "./HealthConditionPage.css";

const HealthConditionPage = () => {
  const { userId } = useUserContext();
  const [healthCondition, setHealthCondition] = useState({
    mentalHealthHistory: [],
    isReceivingTreatment: false,
    treatmentDetails: "",
    physicalHealthIssues: "",
    isTakingMedication: false,
    medicationDetails: "",
  });

  const [loading, setLoading] = useState(false);

  const options = {
    mentalHealthHistory: ["抑郁", "焦虑", "双相情感障碍", "PTSD", "OCD", "其他"],
  };

  // 获取用户保存的数据
  useEffect(() => {
    const fetchHealthCondition = async () => {
      if (!userId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("user_health_condition")
        .select("health_condition")
        .eq("user_id", userId)
        .single();

      if (data) {
        setHealthCondition(data.health_condition);
      } else if (error) {
        console.error("Error fetching health condition:", error);
      }
      setLoading(false);
    };

    fetchHealthCondition();
  }, [userId]);

  // 保存数据到数据库
  const saveHealthCondition = async () => {
    if (!userId) return;

    setLoading(true);

    try {
      // Step 1: 保存健康状况数据到数据库
      const { error } = await supabase
        .from("user_health_condition")
        .upsert({
          user_id: userId,
          health_condition: healthCondition,
        });

      if (error) {
        console.error("Error saving health condition:", error);
        alert("保存失败，请稍后重试！");
        return;
      }

      alert("保存成功！");

        // Step 3: 生成提示词并保存（不使用 ai_id）
        const updatedPrompt = await generatePromptsForUser(userId);
      
        // Step 4: 保存提示词到数据库（去掉 ai_id 相关信息）
        const { error: savePromptError } = await supabase
            .from("user_prompts_summary")
            .upsert({
              user_id: userId,
              full_prompt: updatedPrompt,
            },
            { onConflict: ["user_id"] }  // 确保只有相同 user_id 的记录才会被更新
          );
      
        if (savePromptError) {
          console.error("保存提示词失败：", savePromptError.message);
        } else {
          console.log("提示词已成功保存");
        }
      
        // 提示用户保存成功
        //alert("健康状况保存成功！提示词已更新并保存！");
      } catch (error) {
        console.error("保存过程中发生错误：", error);
        alert("保存失败，请检查网络连接或稍后重试！");
      } finally {
        setLoading(false); // 重置保存状态
      }
  };

  // 处理输入变化
  const handleChange = (field: string, value: string) => {
    setHealthCondition((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="health-condition-container">
      <h2>健康状况</h2>
        <form>
          <h3>心理健康历史</h3>
          <div>
            {options.mentalHealthHistory.map((option) => (
              <label key={option}>
                <input
                  type="checkbox"
                  checked={healthCondition.mentalHealthHistory.includes(option)}
                  onChange={(e) => {
                    const updatedList = e.target.checked
                      ? [...healthCondition.mentalHealthHistory, option]
                      : healthCondition.mentalHealthHistory.filter((item) => item !== option);
                    handleChange("mentalHealthHistory", updatedList);
                  }}
                />
                {option}
              </label>
            ))}
            <div>
              <label>
                其他（请指定）:
                <input
                  type="text"
                  value={
                    healthCondition.mentalHealthHistory.find((item) =>
                      item.startsWith("其他:")
                    )?.replace("其他:", "") || ""
                  }
                  onChange={(e) => {
                    const othersText = `其他:${e.target.value}`;
                    const updatedList = healthCondition.mentalHealthHistory.filter(
                      (item) => !item.startsWith("其他:")
                    );
                    if (e.target.value.trim()) updatedList.push(othersText);
                    handleChange("mentalHealthHistory", updatedList);
                  }}
                />
              </label>
            </div>
          </div>

          <h3>你目前是否在接受心理健康方面的治疗？</h3>
          <label>
            <input
              type="radio"
              checked={healthCondition.isReceivingTreatment === true}
              onChange={() => handleChange("isReceivingTreatment", true)}
            />
            是
          </label>
          <label>
            <input
              type="radio"
              checked={healthCondition.isReceivingTreatment === false}
              onChange={() => handleChange("isReceivingTreatment", false)}
            />
            否
          </label>
          {healthCondition.isReceivingTreatment && (
            <label>
              如果是，请提供更多细节（可选）:
              <textarea
                value={healthCondition.treatmentDetails}
                onChange={(e) => handleChange("treatmentDetails", e.target.value)}
              />
            </label>
          )}

          <h3>一般健康状况和药物使用</h3>
          <label>
            你是否有任何影响心理健康的身体健康问题？
            <textarea
              value={healthCondition.physicalHealthIssues}
              onChange={(e) => handleChange("physicalHealthIssues", e.target.value)}
            />
          </label>

          <h3>你目前是否在服用任何药物？</h3>
          <label>
            <input
              type="radio"
              checked={healthCondition.isTakingMedication === true}
              onChange={() => handleChange("isTakingMedication", true)}
            />
            是
          </label>
          <label>
            <input
              type="radio"
              checked={healthCondition.isTakingMedication === false}
              onChange={() => handleChange("isTakingMedication", false)}
            />
            否
          </label>
          {healthCondition.isTakingMedication && (
            <label>
              如果是，请分享药物名称和用途（可选）:
              <textarea
                value={healthCondition.medicationDetails}
                onChange={(e) => handleChange("medicationDetails", e.target.value)}
              />
            </label>
          )}

          <button type="button" onClick={saveHealthCondition}>
            保存
          </button>
        </form>
    </div>
  );
};

export default HealthConditionPage;
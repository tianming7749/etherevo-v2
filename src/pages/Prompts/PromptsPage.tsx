import React from "react";
import { generatePromptsForUser } from "../../utils/generatePrompts";
import { useUserContext } from "../../context/UserContext";
import { supabase } from "../../supabaseClient";

const PromptsPage = () => {
  const { userId } = useUserContext();

  const handleTestGeneratePrompts = async () => {
    if (!userId) {
      alert("用户未登录，无法生成提示词！");
      return;
    }

    try {
      // 获取所有属于用户的 AI 列表
      const { data: aiList, error: aiError } = await supabase
        .from("ai_identity")
        .select("ai_id, ai_name") // 获取 AI ID 和名称
        .eq("user_id", userId);

      console.log("Fetched AI List:", { aiList, aiError });

      if (aiError || !aiList || aiList.length === 0) {
        alert("未找到绑定的 AI ID，请检查数据库！");
        return;
      }

      // 为每个 AI 生成提示词
      for (const ai of aiList) {
        const result = await generatePromptsForUser(userId, ai.ai_id);

        if (result.success) {
          console.log(`Successfully generated prompt for AI ID: ${ai.ai_id}`);
        } else {
          console.error(
            `Failed to generate prompt for AI ID: ${ai.ai_id}. Error: ${result.error || "未知错误"}`
          );
        }
      }

      alert("提示词生成完成！");
    } catch (error) {
      console.error("Unexpected error during prompt generation:", error);
      alert(`意外错误：${error.message || "未知错误"}`);
    }
  };

  return (
    <div>
      <h2>提示词生成测试</h2>
      <button onClick={handleTestGeneratePrompts}>测试生成提示词</button>
    </div>
  );
};

export default PromptsPage;
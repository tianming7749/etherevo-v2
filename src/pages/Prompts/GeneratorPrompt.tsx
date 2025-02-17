/*
import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { saveAIPromptToDatabase } from "../../utils/supabaseHelpers";
import { useUserContext } from "../../context/UserContext"; // 引入 UserContext


const GeneratorPrompt = () => {
  const { userId } = useUserContext(); // 从 UserContext 获取 userId
  const [aiList, setAiList] = useState([]); // AI 列表
  const [prompts, setPrompts] = useState([]); // 所有生成的提示词
  const [loading, setLoading] = useState(false); // 加载状态

  // 获取所有 AI 数据
  useEffect(() => {
    const fetchAIList = async () => {
      try {
        const { data, error } = await supabase
          .from("ai_identity")
          .select("ai_id, ai_name"); // 获取 ai_id 和 ai_name

        if (error) throw error;

        setAiList(data.map((ai) => ({ aiId: ai.ai_id, name: ai.ai_name }))); // 映射到统一键名
      } catch (error) {
        console.error("Error fetching AI list:", error.message);
      }
    };
    fetchAIList();
  }, []);

  // 获取单个 AI 的 traits 数据
  const fetchTraits = async (aiId: string) => {
    try {
      const { data, error } = await supabase
        .from("ai_traits")
        .select("traits")
        .eq("ai_id", aiId)
        .single();

      if (error) {
        console.error(`Error fetching traits for AI ID ${aiId}:`, error.message);
        return null;
      }

      console.log(`Traits for AI ID ${aiId}:`, data.traits);
      return data ? data.traits : null;
    } catch (err) {
      console.error(`Unexpected error fetching traits for AI ID ${aiId}:`, err);
      return null;
    }
  };

  // 生成提示词
  const generatePrompt = (traits: any) => {
    if (!traits) {
      return "无法生成提示词，性格特点数据为空。";
    }
    const {
      core_traits,
      behavior_style,
      knowledge_skills,
      emotional_expression,
      cultural_social,
      custom,
    } = traits;

    return `
      用户希望AI：
      表现出以下核心性格特点：${core_traits?.join(", ") || "无"}。
      在交流中体现这些行为风格：${behavior_style?.join(", ") || "无"}。
      在这些知识领域表现出特定能力：${knowledge_skills?.join(", ") || "无"}。
      在情感上表现为：${emotional_expression?.join(", ") || "无"}。
      在文化和社会方面体现：${cultural_social?.join(", ") || "无"}。
      具有以下自定义特点：${custom?.join(", ") || "无"}。
    `.trim();
  };

  // 生成并保存所有 AI 的提示词
  const generateAndSavePrompts = async () => {
    if (!userId) {
      console.error("User ID is missing. Cannot save the prompts.");
      return;
    }

    setLoading(true);
    const allPrompts = [];
  
    for (const ai of aiList) {
      try {
        const traits = await fetchTraits(ai.aiId);
        if (!traits) continue;
  
        const prompt = generatePrompt(traits);
        if (!prompt) continue;
  
        allPrompts.push({ aiId: ai.aiId, name: ai.name, content });
  
        console.log("Saving prompt to database:", { aiId: ai.aiId, content });
        await saveAIPromptToDatabase(ai.aiId, content); // 修复传递参数
      } catch (err) {
        console.error(`Error processing AI ID ${ai.aiId}:`, JSON.stringify(err, null, 2));
      }
    }
  
    setPrompts(allPrompts);
    setLoading(false);
  };

  */
 /*
  return (
    <div>
      <h2>AI 性格设定提示词生成</h2>
      <button onClick={generateAndSavePrompts} disabled={loading}>
        {loading ? "正在生成和保存..." : "生成并保存所有提示词"}
      </button>

      {/* 显示生成的所有提示词 */  /*}
      <div style={{ marginTop: "20px" }}>
        {prompts.map((item) => (
          <div
            key={item.aiId}
            style={{ marginBottom: "20px", padding: "10px", border: "1px solid #ccc" }}
          >
            <h3>{item.name} 的提示词：</h3>
            <pre style={{ whiteSpace: "pre-wrap" }}>{item.prompt}</pre>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GeneratorPrompt;
*/
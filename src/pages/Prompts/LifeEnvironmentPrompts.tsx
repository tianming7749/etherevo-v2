/*
import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { saveEnvironmentPromptToDatabase } from "../../utils/supabaseHelpers";

const LifeEnvironmentPrompts = () => {
  const [environmentInfo, setEnvironmentInfo] = useState<any | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch the latest environment info on component mount
    fetchLatestEnvironmentInfo();
  }, []);

  /**
   * Fetches the latest life environment info for the authenticated user
  
  const fetchLatestEnvironmentInfo = async () => {
    setLoading(true);
    try {
      // Fetch the current authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("User not authenticated.", userError);
        setLoading(false);
        return;
      }

      // Query the latest entry from the life_environment table for the user
      const { data, error } = await supabase
        .from("life_environment")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching latest environment info:", error);
        setEnvironmentInfo(null);
        setPrompt(null);
      } else {
        setEnvironmentInfo(data);
        await generatePrompt(data, user.id);
      }
    } catch (err) {
      console.error("Unexpected error fetching environment info:", err);
      setEnvironmentInfo(null);
      setPrompt(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generates a prompt based on the fetched life environment info
   * and saves it to the database
   * @param data - The latest life environment data
   * @param userId - The authenticated user's ID
   
  const generatePrompt = async (data: any, userId: string) => {
    if (!data) {
      setPrompt(null);
      return;
    }

    let relationshipStress = [];
    try {
      // Parse relationship_stress field if needed
      relationshipStress = Array.isArray(data.relationship_stress)
        ? data.relationship_stress
        : JSON.parse(data.relationship_stress || "[]");
    } catch (err) {
      console.error("Error parsing relationship_stress:", err);
      relationshipStress = [];
    }

    // Format relationship stress details
    const relationshipDetails = relationshipStress
      .map((item: any) => `${item.type || "未知"}：${item.status || "未知"}`)
      .join("\n      ");

    // Generate the formatted prompt
    const formattedPrompt = `
      用户生活环境和压力源如下：
工作或学习压力：${data.stress_level || "未知"} 
家庭关系或个人关系状况：
      ${relationshipDetails || "无信息"}
经济压力：${data.financial_stress || "未知"} 
睡眠质量：${data.sleep_quality || "未知"} 
饮食习惯：${data.diet_satisfaction || "未知"} 
其他细节：${data.additional_details || "无"}
    `.trim();

    setPrompt(formattedPrompt);

    // Save the prompt to the database
    try {
      await saveEnvironmentPromptToDatabase(userId, formattedPrompt);
    } catch (error) {
      console.error("Error saving environment prompt to database:", error);
    }
  };

  return (
    <div>
      <h2>生活环境和压力源提示词</h2>
      {loading ? (
        <p>加载中...</p>
      ) : prompt ? (
        <div>
          <pre style={{ whiteSpace: "pre-wrap" }}>{prompt}</pre>
        </div>
      ) : (
        <p>未能生成提示词。</p>
      )}
    </div>
  );
};

export default LifeEnvironmentPrompts;
*/
import { supabase } from "../supabaseClient";

/**
 * 保存或更新生活环境和压力源提示词到 environment_prompts 表
 * @param userId 用户 ID
 * @param content 提示词内容
 */
export const saveEnvironmentPromptToDatabase = async (
  userId: string,
  content: string
) => {
  try {
    const { data, error } = await supabase
      .from("environment_prompts")
      .upsert(
        {
          user_id: userId,
          content,
          updated_at: new Date().toISOString(),
        },
        { onConflict: ["user_id"] } // 确保同一用户只有一条记录
      );

    if (error) {
      console.error("Error saving environment prompt to database:", error.message);
      throw error;
    }

    console.log("Environment prompt saved successfully:", data);
    return data;
  } catch (err: any) {
    console.error("Error saving environment prompt to database:", err.message || err);
    throw err;
  }
};

/**
 * 保存或更新用户目标到 user_goals 表
 * @param userId 用户 ID
 * @param goals 用户选择的目标列表（数组），包含目标名称和优先级
 */
export const saveUserGoals = async (
  userId: string,
  goals: string[],
) => {
  try {
    const { error } = await supabase
      .from("user_goals")
      .upsert(
        {
          user_id: userId,
          goals,
        },
        { onConflict: ["user_id"] } // 确保字段与表中的唯一约束一致
      );

    if (error) {
      console.error("Error saving user goals:", error.message);
      throw error;
    }

    console.log("User goals saved successfully");
  } catch (error) {
    console.error("Error saving user goals:", error);
    throw error;
  }
};

/**
 * 获取用户目标
 * @param userId 用户 ID
 * @returns Promise that resolves to an array of goals or an empty array if no goals are found
 */
export const fetchUserGoals = async (userId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from("user_goals")
      .select("goals")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user goals:", error);
      throw error;
    }

    // If data is null (no goals found), return an empty array
    return data?.goals || [];
  } catch (error) {
    console.error("Error fetching user goals:", error);
    throw error;
  }
};

/**
 * 保存用户提示词到 user_prompts_summary 表
 * @param userId 用户 ID
 * @param prompt 提示词内容
 */
export const saveUserPrompt = async (userId: string, prompt: string) => {
  try {
    const { error } = await supabase
      .from("user_prompts_summary")
      .upsert(
        {
          user_id: userId,
          full_prompt: prompt,
        },
        { onConflict: ["user_id"] }
      );

    if (error) {
      console.error("Error saving user prompt to database:", error.message);
      throw error;
    }

    console.log("User prompt saved successfully to user_prompts_summary table");
  } catch (err: any) {
    console.error("Error saving user prompt to database:", err.message || err);
    throw err;
  }
};
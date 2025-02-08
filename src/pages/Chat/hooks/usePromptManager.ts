import { supabase } from "../supabaseClient"; // 假设你的 Supabase 客户端是这样的路径

export const usePromptManager = (userId: string | null) => {
  const sendPromptToModel = async (): Promise<string | null> => {
    if (!userId) {
      console.error("User ID is empty or invalid. Cannot send prompt.");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("user_prompts_summary")
        .select("full_prompt")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching prompt from Supabase:", error.message);
        return null;
      }

      if (!data || !data.full_prompt) {
        console.warn("No prompt data found for the given user ID:", userId);
        return null;
      }

      console.log("Sending prompt to model:", data.full_prompt);
      return data.full_prompt; // 返回提示词
    } catch (error) {
      console.error("Unexpected error sending prompt to model:", error);
      return null;
    }
  };

  return { sendPromptToModel };
};
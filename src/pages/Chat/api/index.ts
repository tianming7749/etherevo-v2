import { supabase } from '../../../supabaseClient';

// 获取提示词
export const fetchPrompt = async (aiId: string): Promise<string> => {
  const { data, error } = await supabase
    .from('user_prompts_summary')
    .select('full_prompt')
    .single();

  if (error) throw new Error('Failed to fetch AI prompt');
  return data.full_prompt;
};

// 获取聊天记录
export const fetchChatHistory = async (userId: string, aiId: string) => {
  const { data, error } = await supabase
    .from('chat_history')
    .select('message, sender')
    .eq('user_id', userId)

  if (error) throw new Error('Failed to fetch chat history');
  return data || [];
};

// 发送消息到大模型
export const sendMessageToAPI = async (message: string): Promise<string> => {
  // 模拟 API 调用
  return new Promise((resolve) => {
    setTimeout(() => resolve(`AI response to: ${message}`), 1000);
  });
};
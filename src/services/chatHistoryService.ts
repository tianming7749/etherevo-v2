import { supabase } from '../supabaseClient'; 

// 添加一条新的聊天记录
export const addChatMessage = async (userId, message, sender) => {
  const { data, error } = await supabase
    .from('chat_history')
    .insert({
      user_id: userId,
      chat_data: {
        message: message,
        sender: sender
      }
    });
  if (error) throw error;
  return data;
};

// 获取用户的聊天历史
export const getChatHistory = async (userId) => {
  const { data, error } = await supabase
    .from('chat_history')
    .select('id, chat_data, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
};

// 更新聊天记录
export const updateChatMessage = async (id, userId, updatedMessage) => {
  const { data, error } = await supabase
    .from('chat_history')
    .update({
      chat_data: {
        message: updatedMessage
      }
    })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
  return data;
};
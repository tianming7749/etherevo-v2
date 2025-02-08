// ChatService.ts
import { supabase } from '../../supabaseClient';

export const saveMessage = async (userId: string, sessionId: string, message: string, sender: string) => {
  await supabase.from("chat_history").insert({
    user_id: userId,
    session_id: sessionId,
    created_at: new Date(),
    chat_data: {
      message,
      sender
    }
  });
};

export const loadChatHistory = async (userId: string, sessionId: string) => {
  const { data, error } = await supabase
    .from("chat_history")
    .select("id, chat_data")
    .eq("user_id", userId)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
};

// 其他与聊天相关的服务函数
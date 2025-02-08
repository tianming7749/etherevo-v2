// services/chatSummaryService.ts
import axios from 'axios';
import { supabase } from '../supabaseClient';

// LM Studio API 端点
const LmStudioApiUrl = 'http://192.168.1.14:1234/v1/chat/completions';

export const summarizeChat = async (userId: string, session_id: string) => {
  try {
    const { data: chatHistory, error } = await supabase
      .from('chat_history')
      .select('chat_data')
      .eq('user_id', userId)
      .eq('session_id', session_id) // 使用 session_id 来查询特定会话的聊天记录
      .order('created_at', { ascending: true }); // 获取完整会话，不再限制条数

    if (error || !chatHistory || chatHistory.length === 0) {
      console.error("Error or no chat history found for session:", error);
      throw new Error('Failed to fetch chat history for session');
    }

    const messagesContent = chatHistory.map(msg => msg.chat_data.message).join('\n');

    const summaryResponse = await axios.post(LmStudioApiUrl, {
      model: "meta-llama-3.1-8b-instruct@8bit",
      messages: [
        {
          role: "system",
          content: "Summarize the following conversation:"
        },
        {
          role: "user",
          content: messagesContent
        }
      ]
    });

    const summary = summaryResponse.data.choices?.[0]?.message?.content || "Summary unavailable";

    // 使用 upsert 操作，以确保如果session_id已经存在，会更新现有记录
    const { error: updateError } = await supabase.from('memory_archive').upsert({
      user_id: userId,
      session_id: session_id,
      memory_data: { 
        summary: summary, 
        last_update: new Date() // 添加时间戳以便排序和管理
      }
    }, { onConflict: ['user_id', 'session_id'] });

    if (updateError) {
      console.error("Error updating summary into memory_archive:", updateError);
      throw new Error('Failed to save or update chat summary');
    }

    console.log("Chat summary for session saved successfully");
  } catch (error) {
    console.error("Error summarizing chat for session:", error);
    // 这里可以考虑是否需要额外的用户反馈或状态管理
    throw error; // 重新抛出错误以便调用者可以处理
  }
};
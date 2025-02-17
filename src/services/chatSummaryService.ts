// services/chatSummaryService.ts
import axios from 'axios';
import { supabase } from '../supabaseClient';

// **🚀 修改点 1:  更新 API Endpoint 为通义千问 OpenAI 兼容模式  🚀**
const tongyiEndpoint = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

// **✅  修改 summarizeChat 函数，添加 apiKey 参数  ✅**
export const summarizeChat = async (apiKey: string, userId: string, session_id: string) => {
  try {
    // **✅  优化点 1:  限制获取最近 20 条聊天记录 (最近 10 轮对话)  ✅**
    const { data: chatHistory, error } = await supabase
      .from('chat_history')
      .select('chat_data')
      .eq('user_id', userId)
      .eq('session_id', session_id)
      .order('created_at', { ascending: false }) //  先按时间倒序排列，获取最新的记录
      .limit(20) //  限制返回最近 20 条消息
      .order('created_at', { ascending: true }); //  *再次*  按时间正序排列，确保消息顺序正确

    if (error || !chatHistory || chatHistory.length === 0) {
      console.error("Error or no chat history found for session:", error);
      throw new Error('Failed to fetch chat history for session');
    }

    const messagesContent = chatHistory.map(msg => msg.chat_data.message).join('\n');

    // **🚀 修改点 2:  使用通义千问 API Endpoint 和 请求体  🚀**
    const summaryResponse = await axios.post(tongyiEndpoint, {
      // **✅  请求体参数适配通义千问 API (OpenAI 兼容模式)  ✅**
      model: "llama3.1-70b-instruct", // **✅  使用通义千问 plus 模型 (请根据实际模型名称调整)  ✅**
      messages: [
        {
          role: "system",
          content: "Summarize the following conversation in a few short sentences:" //  ✅  更明确的总结指令
        },
        {
          role: "user",
          content: messagesContent
        }
      ],
    }, { // **🚀 修改点 3:  添加 headers， 用于 API Key 认证  🚀**
      headers: {
        'Authorization': `Bearer ${apiKey}`, // **✅  添加 Authorization 标头，并使用 apiKey 参数  ✅**
        'Content-Type': 'application/json'
      }
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

export default summarizeChat;
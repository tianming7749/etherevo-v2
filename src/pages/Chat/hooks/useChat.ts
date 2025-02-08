import { useState, useEffect } from 'react';
import { fetchChatHistory, sendMessageToAPI } from '../api';
import { supabase } from '../../../supabaseClient';

export const useChat = (userId: string) => {
  const [messages, setMessages] = useState([]); // 聊天记录
  const [loading, setLoading] = useState(true); // 加载状态
  const [fullPrompt, setFullPrompt] = useState(''); // 最新提示词

  // 初始化聊天，加载提示词和历史记录
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // 从数据库获取最新提示词
        const { data, error } = await supabase
          .from('user_prompts_summary')
          .select('full_prompt')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error fetching prompt:', error);
        } else if (data && data.length > 0) {
          setFullPrompt(data[0].full_prompt); // 设置提示词
          // 无痕发送提示词到大模型
          await sendMessageToAPI(data[0].full_prompt);
        }

        // 获取历史记录
        const history = await fetchChatHistory(userId);
        // Assuming fetchChatHistory returns an array of {id, sender, message} from JSONB now
        setMessages(history);
      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        setLoading(false); // 完成初始化
      }
    };

    initializeChat();
  }, [userId]);

  // 发送消息
  const sendMessage = async (message: string) => {
    const newMessage = { sender: 'user', message };
    setMessages((prev) => [...prev, newMessage]); // 添加用户消息到本地状态

    try {
      const aiResponse = await sendMessageToAPI(message);
      setMessages((prev) => [...prev, { sender: 'ai', message: aiResponse }]); // 添加 AI 响应到本地状态
      
      // Save AI and user's message to database
      await supabase.from("chat_history").insert([
        {
          user_id: userId,
          created_at: new Date(),
          chat_data: {
            message: message,
            sender: 'user'
          }
        },
        {
          user_id: userId,
          created_at: new Date(),
          chat_data: {
            message: aiResponse,
            sender: 'ai'
          }
        }
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return { messages, sendMessage, loading };
};
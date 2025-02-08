import { useState, useEffect, useRef } from "react";
import { useMessageHandler } from "./hooks/useMessageHandler";
import { summarizeChat } from "../../services/chatSummaryService";
import { handleStreamedResponse } from "../../services/StreamService";
import { analyzeEmotion } from '../../services/EmotionAnalysisService';
import { supabase } from "../../supabaseClient";

const useChatController = ({ userId, sessionId }) => {
  const [input, setInput] = useState("");
  const { messages, setMessages, messagesEndRef } = useMessageHandler(userId);
  const [isSending, setIsSending] = useState(false);
  const [context, setContext] = useState<{ role: 'system' | 'user' | 'assistant', content: string }[]>([]);
  const [fullPrompt, setFullPrompt] = useState("");
  const [emotionState, setEmotionState] = useState<string | null>(null);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (userId) {
      const fetchData = async () => {
        try {
          // 加载用户提示
          const { data: promptData, error: promptError } = await supabase
            .from("user_prompts_summary")
            .select("full_prompt")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (promptError) {
            console.error("获取提示时出错:", promptError);
          } else if (promptData) {
            setFullPrompt(promptData.full_prompt);
            console.log("加载的提示词:", promptData.full_prompt); // 新增日志
          } else {
            console.log("没有找到提示词"); // 如果没有找到提示词
          }

          // 加载长记忆
          const { data: memoryData, error: memoryError } = await supabase
            .from('memory_archive')
            .select('memory_data')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(3);

          if (memoryError) {
            throw memoryError;
          }
          if (memoryData && memoryData.length > 0) {
            setContext(prev => [
              ...prev, 
              { role: 'system', content: memoryData[0].memory_data.summary || "没有可用的记忆数据。" }
            ]);
          }

          // 加载聊天历史
          const { data, error } = await supabase
            .from("chat_history")
            .select("id, chat_data")
            .eq("user_id", userId)
            .order("created_at", { ascending: true });

          if (error) {
            throw error;
          }

          const newMessages = data.map(item => ({
            id: item.id,
            sender: item.chat_data.sender,
            text: item.chat_data.message
          }));
          setMessages(newMessages);
          console.log("聊天历史加载成功, 加载的消息数量:", newMessages.length);

        } catch (error) {
          console.error("加载聊天数据时出错:", error);
        }
      };

      fetchData();
    }
  }, [userId]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    const tempUserMessage = { id: Date.now(), sender: "User", text: userMessage };
    
    setMessages(prevMessages => [...prevMessages, tempUserMessage]);
    setContext(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsSending(true);

    const thinkingMessage = { id: Date.now() + 1, sender: "AI", text: "Thinking..." };
    setMessages(prevMessages => [...prevMessages, thinkingMessage]);

    let finalResponse = '';

    try {
      const emotionAnalysis = await analyzeEmotion(userMessage);
      setEmotionState(emotionAnalysis.emotion);
      console.log('检测到的情绪:', emotionAnalysis.emotion, '情绪分析描述:', emotionAnalysis.description);

      // 保存用户消息到Supabase
      await supabase.from("chat_history").insert({
        user_id: userId,
        session_id: sessionId,
        created_at: new Date(),
        chat_data: { message: userMessage, sender: "User" }
      });

      // 处理流式响应
      await handleStreamedResponse("http://192.168.1.173:1234/v1/chat/completions", {
        model: "meta-llama-3.1-8b-instruct@8bit",
        messages: [
          ...context,
          { role: "system", content: fullPrompt },
          { role: "user", content: userMessage },
          { role: "system", content: `当前情绪状态: ${emotionState}` }
        ],
        stream: true
      }, (chunk) => {
        if (finalResponse === '') {
          // 第一次收到数据块时，直接用该数据块内容替换"Thinking..."
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === thinkingMessage.id ? { ...msg, text: chunk } : msg
          )
        );
      } else {
        // 后续数据块累加到已有的文本上
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === thinkingMessage.id ? { ...msg, text: msg.text + chunk } : msg
          )
        );
      }
      finalResponse += chunk;
      });

      setIsSending(false);

      if (finalResponse) {
        setContext(prev => [...prev, { role: 'assistant', content: finalResponse }]);
        // 保存AI响应到Supabase
        await supabase.from("chat_history").insert({
          user_id: userId,
          session_id: sessionId,
          created_at: new Date(),
          chat_data: { message: finalResponse, sender: "AI" }
        });
        console.log("AI响应已接收并保存");
      } else {
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === thinkingMessage.id ? { ...msg, text: "没有从模型获取到响应。" } : msg
          )
        );
        console.log("没有接收到AI响应，保存默认消息");
      }

      // 汇总聊天记录
      if (sessionId) {
        await summarizeChat(userId, sessionId);
        console.log("聊天汇总成功");
      } else {
        console.error("没有可用的会话ID来汇总聊天");
      }

    } catch (error) {
      console.error("聊天过程中详细错误:", error);
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === thinkingMessage.id ? { ...msg, text: "错误：无法获取响应。" } : msg
        )
      );
      setIsSending(false);
    }
  };

  const clearChat = async () => {
    try {
      await supabase
        .from("chat_history")
        .delete()
        .eq("user_id", userId)
        .eq("session_id", sessionId);

      setMessages([]);
      setContext([]);
      console.log("聊天历史清除成功");
    } catch (error) {
      console.error("从数据库清除聊天历史时出错:", error);
    }
  };

  return {
    messages,
    setMessages,
    handleSendMessage,
    clearChat,
    isSending,
    input,
    setInput,
    messagesEndRef,
    fullPrompt,
    setFullPrompt
  };
};

export default useChatController;
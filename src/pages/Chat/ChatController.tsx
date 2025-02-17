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
  // ✅ 修改点 1:  context 状态只保留 *动态* 对话历史，  *移除* 初始化的 system context
  const [context, setContext] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [fullPrompt, setFullPrompt] = useState("");
  const [emotionState, setEmotionState] = useState<string | null>(null);
  const messagesRef = useRef(messages);
  const [turnCount, setTurnCount] = useState(0);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (userId && userId !== null) {
      const fetchData = async () => {
        try {
          // 加载用户提示 (仅加载一次，组件初始化时)
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
            console.log("加载的提示词:", promptData.full_prompt);
          } else {
            console.log("没有找到提示词");
          }

          // 加载长记忆 (仅加载 *最近一条* 记忆，组件初始化时)  ✅  优化点 2:  减少初始加载的记忆数量，例如只加载一条
          const { data: memoryData, error: memoryError } = await supabase
            .from('memory_archive')
            .select('memory_data')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1); //  ✅  修改为 limit(1)

          if (memoryError) {
            throw memoryError;
          }
          if (memoryData && memoryData.length > 0) {
            // ✅  只设置 *动态* context， 移除 prev， 避免重复加载
            setContext([
              { role: 'system', content: memoryData[0].memory_data.summary || "没有可用的记忆数据。" }
            ]);
            console.log("初始记忆加载成功"); //  ✅ 添加日志
          } else {
            console.log("没有找到初始记忆"); //  ✅ 添加日志
          }


          // 加载聊天历史 (保持不变)
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
  }, [userId]); //  ✅  useEffect 依赖于 userId， 组件初始化或 userId 变化时加载


  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    const tempUserMessage = { id: Date.now(), sender: "User", text: userMessage };

    setMessages(prevMessages => [...prevMessages, tempUserMessage]);
    setContext(prev => [...prev, { role: 'user', content: userMessage }]); //  ✅  *动态* 更新 context， 只添加用户消息
    setIsSending(true);

    const thinkingMessage = { id: Date.now() + 1, sender: "AI", text: "Thinking..." };
    setMessages(prevMessages => [...prevMessages, thinkingMessage]);

    let finalResponse = '';

    try {
      const apiKey = import.meta.env.VITE_DASHSCOPE_API_KEY;
      if (!apiKey) {
        console.error("API Key 未配置！请检查 REACT_APP_DASHSCOPE_API_KEY 环境变量。");
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === thinkingMessage.id ? { ...msg, text: "错误：API Key 未配置。" } : msg
          )
        );
        setIsSending(false);
        return;
      }

      //const emotionAnalysis = await analyzeEmotion(apiKey, userMessage);
      //setEmotionState(emotionAnalysis.emotion);
      //console.log('检测到的情绪:', emotionAnalysis.emotion, '情绪分析描述:', emotionAnalysis.description);

      await supabase.from("chat_history").insert({
        user_id: userId,
        session_id: sessionId,
        created_at: new Date(),
        chat_data: { message: userMessage, sender: "User" }
      });


      const tongyiEndpoint = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

      await handleStreamedResponse(
        apiKey,
        tongyiEndpoint,
        {
          model: "llama3.1-70b-instruct",
          messages: [
            // ✅ 修改点 2:  不再每次发送 fullPrompt,  只在 messages 中包含 *动态* context 和 用户消息
            ...context,
            //{ role: "system", content: fullPrompt }, //  ❌  移除每次发送 fullPrompt
            { role: "user", content: userMessage },
            //{ role: "system", content: `当前情绪状态: ${emotionState}` }
          ],
          stream: true,
          temperature: 0.5,
          top_p: 0.7,
        },
        (chunk) => {
          if (finalResponse === '') {
            setMessages(prevMessages =>
              prevMessages.map(msg =>
                msg.id === thinkingMessage.id ? { ...msg, text: chunk } : msg
              )
            );
          } else {
            setMessages(prevMessages =>
              prevMessages.map(msg =>
                msg.id === thinkingMessage.id ? { ...msg, text: msg.text + chunk } : msg
              )
            );
          }
          finalResponse += chunk;
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );


      setIsSending(false);

      if (finalResponse) {
        setContext(prev => [...prev, { role: 'assistant', content: finalResponse }]); //  ✅ *动态* 更新 context， 添加 AI 响应
        await supabase.from("chat_history").insert({
          user_id: userId,
          session_id: sessionId,
          created_at: new Date(),
          chat_data: { message: finalResponse, sender: "AI" }
        });
        console.log("AI响应已接收并保存");


        if (sessionId) {
          if (turnCount % 2 === 0 && turnCount > 0) {
            await summarizeChat(apiKey, userId, sessionId);
            console.log("聊天汇总成功 (每 2 轮对话)");
          }
        } else {
          console.error("没有可用的会话ID来汇总聊天");
        }


      } else {
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === thinkingMessage.id ? { ...msg, text: "没有从模型获取到响应。" } : msg
          )
        );
        console.log("没有接收到AI响应，保存默认消息");
      }

    } catch (error) {
      console.error("聊天过程中详细错误:", error);
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === thinkingMessage.id ? { ...msg, text: "错误：无法获取响应。" } : msg
        )
      );
      setIsSending(false);
    } finally {
      setTurnCount(prevCount => prevCount + 1);
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
      // ✅ 修改点 3:  clearChat 时， *仅清除动态 context*,  *保留* fullPrompt (初始提示词)
      setContext([]); //  ✅  仅清除 *动态* context
      setTurnCount(0);
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
    fullPrompt, // ✅  fullPrompt 仍然导出， 但不再在 handleSendMessage 中使用
    setFullPrompt,
    turnCount
  };
};

export default useChatController;
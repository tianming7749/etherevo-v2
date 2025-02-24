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
  const [context, setContext] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [fullPrompt, setFullPrompt] = useState("");
  const [emotionState, setEmotionState] = useState<string | null>(null);
  const [turnCount, setTurnCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (userId && userId !== null) {
      const fetchData = async () => {
        try {
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

          const { data: memoryData, error: memoryError } = await supabase
            .from('memory_archive')
            .select('memory_data')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1);

          if (memoryError) {
            throw memoryError;
          }
          if (memoryData && memoryData.length > 0) {
            setContext([
              { role: 'system', content: memoryData[0].memory_data.summary || "没有可用的记忆数据。" }
            ]);
            console.log("初始记忆加载成功");
          } else {
            console.log("没有找到初始记忆");
          }

          await loadInitialMessages();

        } catch (error) {
          console.error("加载聊天数据时出错:", error);
        }
      };

      fetchData();
    }
  }, [userId]);

  const loadInitialMessages = async () => {
    const { data, error } = await supabase
      .from("chat_history")
      .select("id, chat_data")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("加载初始聊天记录出错:", error);
      return;
    }

    const newMessages = data.reverse().map(item => ({
      id: item.id,
      sender: item.chat_data.sender,
      text: item.chat_data.message
    }));
    setMessages(newMessages);
    setHasMore(data.length === 50);
    console.log("初始聊天历史加载成功, 记录数:", newMessages.length);
  };

  const loadMoreMessages = async () => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    const oldestMessageId = messages[0]?.id;
    const { data, error } = await supabase
      .from("chat_history")
      .select("id, chat_data")
      .eq("user_id", userId)
      .lt("id", oldestMessageId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("加载更多聊天记录出错:", error);
      setIsLoadingMore(false);
      return;
    }

    const newMessages = data.reverse().map(item => ({
      id: item.id,
      sender: item.chat_data.sender,
      text: item.chat_data.message
    }));
    setMessages(prev => [...newMessages, ...prev]);
    setPage(prev => prev + 1);
    setHasMore(data.length === 50);
    setIsLoadingMore(false);
    console.log("加载更多聊天记录成功, 新增记录数:", newMessages.length);
  };

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
      const apiKey = import.meta.env.VITE_DASHSCOPE_API_KEY;
      if (!apiKey) {
        console.error("API Key 未配置！");
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === thinkingMessage.id ? { ...msg, text: "错误：API Key 未配置。" } : msg
          )
        );
        setIsSending(false);
        return;
      }

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
          messages: [...context, { role: "user", content: userMessage }],
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
        setContext(prev => [...prev, { role: 'assistant', content: finalResponse }]);
        await supabase.from("chat_history").insert({
          user_id: userId,
          session_id: sessionId,
          created_at: new Date(),
          chat_data: { message: finalResponse, sender: "AI" }
        });
        console.log("AI响应已接收并保存");

        if (sessionId && turnCount % 2 === 0 && turnCount > 0) {
          await summarizeChat(apiKey, userId, sessionId);
          console.log("聊天汇总成功 (每 2 轮对话)");
        }
      } else {
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === thinkingMessage.id ? { ...msg, text: "没有从模型获取到响应。" } : msg
          )
        );
      }
    } catch (error) {
      console.error("聊天过程中出错:", error);
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === thinkingMessage.id ? { ...msg, text: "错误：无法获取响应。" } : msg
        )
      );
    } finally {
      setIsSending(false);
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
      setContext([]);
      setTurnCount(0);
      setPage(1);
      setHasMore(true);
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
    setFullPrompt,
    loadMoreMessages,
    hasMore,
    isLoadingMore
  };
};

export default useChatController;
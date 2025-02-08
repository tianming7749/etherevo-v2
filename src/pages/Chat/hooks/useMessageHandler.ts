import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { supabase } from "../../../supabaseClient";

export const useMessageHandler = (userId: string | null, selectedAi: string | null) => {
  const [messages, setMessages] = useState<{ id?: number; sender: string; text: string }[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 加载聊天记录
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const { data, error } = await supabase
          .from("chat_history")
          .select("id, user_id, created_at, chat_data")
          .eq("user_id", userId)
          .order("created_at", { ascending: true });

        if (error) {
          throw new Error("Error fetching chat history");
        }

        setMessages(
          (data || []).map((record) => ({
            id: record.id,
            sender: record.chat_data.sender,
            text: record.chat_data.message,
          }))
        );
      } catch (error) {
        console.error(error);
        setErrorMessage("Failed to fetch chat history.");
      }
    };

    fetchChatHistory();
  }, [selectedAi, userId]);

  // 保存消息到数据库
  const saveMessage = async (message: string, sender: string) => {
    if (!userId || !selectedAi) return;

    try {
      const { error } = await supabase.from("chat_history").insert([
        {
          user_id: userId,
          created_at: new Date(),
          chat_data: {
            message: message,
            sender: sender
          }
        }
      ]);

      if (error) {
        console.error("Error saving message:", error);
      }
    } catch (error) {
      console.error("Unexpected error saving message:", error);
    }
  };

  // 发送消息
  const sendMessage = async (input: string, sendToModel: (message: string) => Promise<string>) => {
    if (!input.trim()) return;

    const newMessages = [...messages, { sender: "User", text: input }];
    setMessages(newMessages);
    await saveMessage(input, "User");

    try {
      const reply = await sendToModel(input);
      setMessages((prev) => [...prev, { sender: "AI", text: reply }]);
      await saveMessage(reply, "AI");
    } catch (error) {
      console.error("Error communicating with model:", error);
      const errorMessage = "Error communicating with the model.";
      setMessages((prev) => [...prev, { sender: "AI", text: errorMessage }]);
      await saveMessage(errorMessage, "AI");
    }
  };

  return { messages, setMessages, errorMessage, sendMessage, messagesEndRef };
};
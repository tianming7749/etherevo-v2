import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../../context/UserContext";
import ChatHeader from "./components/ChatHeader";
import MessageList from "./components/MessageList";
import ChatInput from "./components/ChatInput";
import "./Chat.css";

import SessionManager from "./SessionManager";
import ChatController from "./ChatController";
import ChatDisplay from "./ChatDisplay";

const Chat: React.FC = () => {
  const { userId, loading } = useUserContext();
  const navigate = useNavigate();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { sessionId } = SessionManager({ userId });
  const { messages, setMessages, handleSendMessage, clearChat, isSending, input, setInput, messagesEndRef, fullPrompt, setFullPrompt } = ChatController({ userId, sessionId });
  const { MessageListComponent, ChatInputComponent, ConfirmationModal } = ChatDisplay({
    messages,
    isSending,
    showConfirmation,
    setShowConfirmation,
    handleSendMessage,
    clearChat,
    messagesEndRef,
    input,
    setInput,
    fullPrompt,
    setFullPrompt
  });

  // **✅  修改点 1:  从环境变量获取 API Key  ✅**
  const apiKey = import.meta.env.VITE_DASHSCOPE_API_KEY;

  if (loading) return <div>加载中...</div>;
  if (!userId) {
    navigate("/login");
    return null;
  }

  return (
    <div className="chat-container">
      {/* **🚀 修改点 2:  将 apiKey prop 传递给 ChatHeader 组件  🚀** */}
      <ChatHeader apiKey={apiKey} onClearChat={() => setShowConfirmation(true)} />
      {MessageListComponent}
      {ChatInputComponent}
      {ConfirmationModal}
    </div>
  );
};

export default Chat;
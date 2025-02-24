import React, { useEffect, useState } from "react";
import "./ChatHeader.css";

interface ChatHeaderProps {
  onClearChat: () => void; // 清空聊天记录的回调函数
  apiKey: string | undefined; // 添加 apiKey prop，用于传递 API Key
  t?: (key: string) => string; // 将 t 设置为可选
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  onClearChat,
  apiKey,
  t = (key) => key, // 默认返回键名，避免未定义时的错误
}) => {
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");

  useEffect(() => {
    /* 
    const checkConnection = async () => {
      if (!apiKey) {
        setConnectionStatus("API Key Not Configured");
        return;
      }

      try {
        const tongyiEndpoint = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
        const response = await fetch(tongyiEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: "llama3.1-70b-instruct",
            messages: [{ role: "user", content: "Hello" }],
            max_tokens: 1,
          }),
        });

        if (response.ok) {
          setConnectionStatus("Connected");
        } else {
          setConnectionStatus("Disconnected");
        }
      } catch (error) {
        setConnectionStatus("Disconnected");
      }
    };

    checkConnection();
    const intervalId = setInterval(checkConnection, 15000);
    return () => clearInterval(intervalId);
    */
  }, [apiKey]);

  return (
    <div className="chat-header">
      {/* 显示连接状态 */}
      {/*
      <div className="connection-status">
        <span>Status: </span>
        <span className={connectionStatus === "Connected" ? "status-connected" : connectionStatus === "API Key Not Configured" ? "status-api-key-not-configured" : "status-disconnected"}>
          {connectionStatus}
        </span>
      </div>
      */}

      {/* 清空聊天按钮 */}
      <button
        onClick={onClearChat}
        className="clear-chat-button"
        title={t('chat.header.clearChat')} // 使用 t 函数，支持多语言
      >
        {t('chat.header.clearChat')} {/* 使用 t 函数替换硬编码文本 */}
      </button>
    </div>
  );
};

export default ChatHeader;
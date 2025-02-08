import React, { useEffect, useState } from "react";
import "./ChatHeader.css";

interface ChatHeaderProps {
  onClearChat: () => void; // 清空聊天记录的回调函数
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  onClearChat,
}) => {
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // 假设有一个API或其他方法来检查LM Studio服务是否可用
        const response = await fetch('http://192.168.1.173:1234/v1/models', { method: 'GET' });
        if (response.ok) {
          setConnectionStatus("Connected");
        } else {
          setConnectionStatus("Disconnected");
        }
      } catch (error) {
        setConnectionStatus("Disconnected");
      }
    };

    // 立即检查连接状态
    checkConnection();

    // 设置定时器以定期检查连接状态
    const intervalId = setInterval(checkConnection, 5000); // 每5秒检查一次

    // 清理定时器
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="chat-header">
      {/* 显示连接状态 */}
      <div className="connection-status">
        <span>Status: </span>
        <span className={connectionStatus === "Connected" ? "status-connected" : "status-disconnected"}>
          {connectionStatus}
        </span>
      </div>

      {/* 清空聊天按钮 */}
      <button
        onClick={onClearChat}
        className="clear-chat-button"
        title="Clear all chat messages"
      >
        Clear Chat
      </button>
    </div>
  );
};

export default ChatHeader;
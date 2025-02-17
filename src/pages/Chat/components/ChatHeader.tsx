import React, { useEffect, useState } from "react";
import "./ChatHeader.css";

interface ChatHeaderProps {
  onClearChat: () => void; // 清空聊天记录的回调函数
  apiKey: string | undefined; //  ✅  添加 apiKey prop， 用于传递 API Key
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  onClearChat,
  apiKey, //  ✅  接收 apiKey prop
}) => {
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");

  useEffect(() => {
    /*  👈  添加 /* 注释开始符
    const checkConnection = async () => {
      if (!apiKey) { //  ✅  如果 apiKey 为空，直接设置为 "API Key Not Configured"
        setConnectionStatus("API Key Not Configured");
        return;
      }

      try {
        // **🚀 修改点 1:  更新 API Endpoint 为通义千问 OpenAI 兼容模式 Chat API  🚀**
        const tongyiEndpoint = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

        // **✅  使用通义千问 Chat API 进行连接检查， 发送一个非常 minimal 的请求  ✅**
        const response = await fetch(tongyiEndpoint, {
          method: 'POST', //  ✅  必须是 POST 请求
          headers: {
            'Authorization': `Bearer ${apiKey}`, //  ✅  带上 API Key
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ //  ✅  Minimal 请求体， 尽量减少 Token 消耗
            model: "llama3.1-70b-instruct", //  ✅  模型可以设置为 llama3.1-70b-instruct 或其他轻量级模型
            messages: [
              { role: "user", content: "Hello" } //  ✅  发送一个非常简单的用户消息
            ],
            max_tokens: 1, //  ✅  限制 max_tokens 为 1， 尽可能减少 Token 生成
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

    // 立即检查连接状态
    checkConnection();

    // 设置定时器以定期检查连接状态
    const intervalId = setInterval(checkConnection, 15000); // **🚀 修改点 2:  降低检查频率到 15 秒 (或更久)  🚀**

    // 清理定时器
    return () => clearInterval(intervalId);
    */  //  👈  添加 */ 注释结束符
  }, [apiKey]); //  ✅  apiKey 变化时重新检查连接状态

  return (
    <div className="chat-header">
    {/* 显示连接状态 */}
    {/*
    <div className="connection-status">  {/*  ✅  使用 JSX 单行注释注释这行 
      <span>Status: </span>  {/*  ✅  使用 JSX 单行注释注释这行
      <span className={connectionStatus === "Connected" ? "status-connected" : connectionStatus === "API Key Not Configured" ? "status-api-key-not-configured" : "status-disconnected"}> {/* ✅  添加 status-api-key-not-configured class */}  {/*  ✅  使用 JSX 单行注释注释这行
        {connectionStatus}  {/*  ✅  使用 JSX 单行注释注释这行
      </span>  {/*  ✅  使用 JSX 单行注释注释这行
    </div>  {/*  ✅  使用 JSX 单行注释注释这行
    */}  


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
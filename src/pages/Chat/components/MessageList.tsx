import React, { useEffect, useRef, RefObject } from "react";

interface Message {
  id?: number;
  sender: string;
  text: string;
}

interface MessageListProps {
  messages: Message[];
  messagesEndRef: RefObject<HTMLDivElement>;
}

const MessageList: React.FC<MessageListProps> = ({ messages, messagesEndRef }) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最底部
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom(); // 每当消息列表更新时自动滚动到底部
  }, [messages]);

  return (
    <div
      ref={messagesContainerRef}
      style={{
        flex: 1,
        overflowY: "auto",
        margin: "10px 0",
        padding: "10px",
        background: "#E6E6FA",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {messages.map((message, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            justifyContent: message.sender === "User" ? "flex-end" : "flex-start", // 用户消息靠右，AI 消息靠左
            margin: "5px 0",
          }}
        >
          <div
            style={{
              padding: "10px",
              borderRadius: "8px",
              backgroundColor:
                message.sender === "User"
                  ? "#B0C4DE"
                  : message.text === "thinking..."
                  ? "#FFD700"
                  : "#ADD8E6",
              textAlign: "left",
              maxWidth: "70%", // 限制消息宽度为聊天框宽度的 70%
              fontStyle: message.text === "thinking..." ? "italic" : "normal",
              color: message.text === "thinking..." ? "#333" : "inherit",
            }}
          >
            {message.text}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
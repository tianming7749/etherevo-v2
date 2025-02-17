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
              whiteSpace: 'pre-line', //  👈  ✅  添加 whiteSpace: 'pre-line' 样式，实现文本换行

              //  ✨  修改点 1:  调整字体大小  ✨
              fontSize: '16px', //  您可以尝试 16px 或 18px，根据您的喜好调整

              //  ✨  修改点 2:  更换字体族系 (选择一种即可) ✨
              fontFamily: 'Arial, sans-serif', //  方案 1:  使用 Arial，通用性强
              // fontFamily: '思源黑体, sans-serif', // 方案 2:  使用思源黑体，中文显示效果好 (如果您的项目引入了思源黑体字体)
              // fontFamily: 'Verdana, sans-serif', // 方案 3:  Verdana，专为屏幕阅读设计

              //  ✨  修改点 3:  增加行高 ✨
              lineHeight: '1.5', // 您可以尝试 1.4, 1.5 或 1.6，根据您的喜好调整

              //  ✨  修改点 4:  (可选) 调整字体粗细 (谨慎使用) ✨
              // fontWeight: '500', //  您可以尝试 '500' (适中) 或 'bold' (加粗)，如果不需要加粗可以注释掉这行
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
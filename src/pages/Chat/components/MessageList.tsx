import React, { RefObject } from "react";

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
  return (
    <div
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
            justifyContent: message.sender === "User" ? "flex-end" : "flex-start",
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
              maxWidth: "70%",
              fontStyle: message.text === "thinking..." ? "italic" : "normal",
              color: message.text === "thinking..." ? "#333" : "inherit",
              whiteSpace: 'pre-line',
              fontSize: '16px',
              fontFamily: 'Arial, sans-serif',
              lineHeight: '1.5',
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
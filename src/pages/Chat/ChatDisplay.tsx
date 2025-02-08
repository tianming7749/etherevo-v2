import React from "react";
import MessageList from "./components/MessageList";
import ChatInput from "./components/ChatInput";

const useChatDisplay = ({ messages, isSending, showConfirmation, setShowConfirmation, handleSendMessage, clearChat, messagesEndRef, input, setInput }) => {
  const MessageListComponent = <MessageList messages={messages} messagesEndRef={messagesEndRef} />;
  const ChatInputComponent = (
    <ChatInput
      input={input}
      onInputChange={(e) => setInput(e.target.value)}
      onSend={handleSendMessage}
      isSending={isSending}
    />
  );

  const ConfirmationModal = showConfirmation ? (
    <div className="confirmation-modal">
      {/* 确认清除弹窗的具体实现... */}
    </div>
  ) : null;

  return { MessageListComponent, ChatInputComponent, ConfirmationModal };
};

export default useChatDisplay;
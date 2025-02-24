import React from "react";
import MessageList from "./components/MessageList";
import ChatInput from "./components/ChatInput";

interface ChatDisplayProps {
  messages: any[]; // 根据实际情况定义消息类型
  isSending: boolean;
  showConfirmation: boolean;
  setShowConfirmation: (value: boolean) => void;
  handleSendMessage: () => void;
  clearChat: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  input: string;
  setInput: (value: string) => void;
  fullPrompt: string; // Chat.tsx 中传递了这个属性
  setFullPrompt: (value: string) => void; // Chat.tsx 中传递了这个属性
  t: (key: string) => string; // 添加 t 函数类型
}

const useChatDisplay = ({
  messages,
  isSending,
  showConfirmation,
  setShowConfirmation,
  handleSendMessage,
  clearChat,
  messagesEndRef,
  input,
  setInput,
  fullPrompt, // 添加未使用的参数
  setFullPrompt, // 添加未使用的参数
  t, // 接收 t 函数
}: ChatDisplayProps) => {
  const MessageListComponent = <MessageList messages={messages} messagesEndRef={messagesEndRef} />;
  const ChatInputComponent = (
    <ChatInput
      input={input}
      onInputChange={(e) => setInput(e.target.value)}
      onSend={handleSendMessage}
      isSending={isSending}
      t={t} // 传递 t 给 ChatInput
    />
  );

  const ConfirmationModal = showConfirmation ? (
    <div className="confirmation-modal">
      <p>{t('chat.confirmationModal.confirmClear')}</p> {/* 使用 t 函数翻译 */}
      <button onClick={clearChat}>{t('chat.confirmationModal.confirm')}</button> {/* 确认按钮 */}
      <button onClick={() => setShowConfirmation(false)}>{t('chat.confirmationModal.cancel')}</button> {/* 取消按钮 */}
    </div>
  ) : null;

  return { MessageListComponent, ChatInputComponent, ConfirmationModal };
};

export default useChatDisplay;
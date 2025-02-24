import React, { useRef } from "react";

interface ChatInputProps {
  input: string;
  onInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  isSending: boolean; // 新增的 prop 用于显示发送状态
  t: (key: string) => string; // 添加 t 函数 prop 用于多语言支持
}

const ChatInput: React.FC<ChatInputProps> = ({ input, onInputChange, onSend, isSending, t }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 动态调整高度
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto"; // 先重置高度
      textarea.style.height = `${Math.min(textarea.scrollHeight, 96)}px`; // 限制最大高度为 3 行（假设每行 32px）
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(event);
    adjustTextareaHeight();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault(); // 防止默认行为（如输入换行）
      onSend(); // 调用发送消息逻辑
    }
  };

  return (
    <div className="chat-input-container">
      <textarea
        ref={textareaRef}
        className="chat-input"
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={t('chat.input.placeholder')} // 使用 t 函数获取占位符
        // disabled={isSending} // 不要禁用输入框，保持它可以输入
      />
      <button
        className="send-button"
        onClick={onSend}
        disabled={isSending} // 只禁用 Send 按钮在发送中
      >
        {isSending ? t('chat.input.sendingButton') : t('chat.input.sendButton')} {/* 使用 t 函数动态切换按钮文本 */}
      </button>
    </div>
  );
};

export default ChatInput;
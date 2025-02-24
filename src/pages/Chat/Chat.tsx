import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useUserContext } from "../../context/UserContext";
import ChatHeader from "./components/ChatHeader";
import MessageList from "./components/MessageList";
import ChatInput from "./components/ChatInput";
import "./Chat.css";
import SessionManager from "./SessionManager";
import ChatController from "./ChatController";
import ChatDisplay from "./ChatDisplay";

const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const Chat: React.FC = () => {
  const { userId, loading } = useUserContext();
  const navigate = useNavigate();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const { sessionId } = SessionManager({ userId });
  const {
    messages,
    setMessages,
    handleSendMessage: originalHandleSendMessage,
    clearChat,
    isSending,
    input,
    setInput,
    messagesEndRef,
    fullPrompt,
    setFullPrompt,
    loadMoreMessages,
    hasMore,
    isLoadingMore
  } = ChatController({ userId, sessionId });
  const { t } = useTranslation();
  const messageListRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = () => {
    setIsSendingMessage(true);
    originalHandleSendMessage().finally(() => {
      setIsSendingMessage(false);
    });
  };

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
    setFullPrompt,
    t,
  });

  const apiKey = import.meta.env.VITE_DASHSCOPE_API_KEY;

  // 初次加载滚动到最底部
  useEffect(() => {
    if (isInitialLoad && messages.length > 0 && messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
      setIsInitialLoad(false);
      console.log("初次加载完成 - scrollTop:", messageListRef.current.scrollTop, "scrollHeight:", messageListRef.current.scrollHeight);
    }
  }, [isInitialLoad, messages]);

  // 发送新消息时滚动到底部
  useEffect(() => {
    if (isSendingMessage && messages.length > 0 && messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
      console.log("发送消息后 - scrollTop:", messageListRef.current.scrollTop, "scrollHeight:", messageListRef.current.scrollHeight);
    }
  }, [isSendingMessage, messages]);

  // 滚动事件处理（带防抖）
  useEffect(() => {
    const handleScroll = debounce(() => {
      if (
        messageListRef.current &&
        messageListRef.current.scrollTop <= 50 &&
        hasMore &&
        !isSending &&
        !isLoadingMore
      ) {
        const scrollTopBefore = messageListRef.current.scrollTop;
        console.log("加载前 - scrollTop:", scrollTopBefore, "scrollHeight:", messageListRef.current.scrollHeight);

        loadMoreMessages().then(() => {
          const restoreScrollPosition = () => {
            if (messageListRef.current) {
              messageListRef.current.scrollTop = scrollTopBefore;
              console.log("加载后恢复 - scrollTop:", messageListRef.current.scrollTop, "scrollHeight:", messageListRef.current.scrollHeight);
            }
          };

          // 多次恢复滚动位置，确保不被覆盖
          requestAnimationFrame(() => {
            restoreScrollPosition();
            setTimeout(() => {
              restoreScrollPosition();
              console.log("最终状态 500ms - scrollTop:", messageListRef.current?.scrollTop, "scrollHeight:", messageListRef.current?.scrollHeight);
              setTimeout(() => {
                restoreScrollPosition();
                console.log("最终状态 1000ms - scrollTop:", messageListRef.current?.scrollTop, "scrollHeight:", messageListRef.current?.scrollHeight);
              }, 1000);
            }, 500);
          });
        });
      }
    }, 200);

    const list = messageListRef.current;
    if (list) {
      list.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (list) {
        list.removeEventListener('scroll', handleScroll);
      }
    };
  }, [loadMoreMessages, hasMore, isSending, isLoadingMore]);

  if (loading) return <div>{t('chat.loading')}</div>;
  if (!userId) {
    navigate("/login");
    return null;
  }

  return (
    <div className="chat-container">
      <ChatHeader apiKey={apiKey} onClearChat={() => setShowConfirmation(true)} t={t} />
      <div ref={messageListRef} className="message-list">
        {isLoadingMore && (
          <div className="loading-indicator">{t('chat.loading')}</div>
        )}
        {MessageListComponent}
      </div>
      {ChatInputComponent}
      {ConfirmationModal}
    </div>
  );
};

export default Chat;
import React, { useState } from "react";
import ChatHeader from "./components/ChatHeader";
import { usePromptManager } from "./hooks/usePromptManager";
import "./ChatPage.css";

interface ChatPageProps {
  userId: string | null;
}

const ChatPage: React.FC<ChatPageProps> = ({ userId }) => {
  const [promptToDisplay, setPromptToDisplay] = useState<string | null>(null);
  const { sendPromptToModel } = usePromptManager(userId);

  const handleSendPrompt = async () => {
    try {
      const prompt = await sendPromptToModel();
      if (prompt) {
        console.log("Prompt sent:", prompt);
        setPromptToDisplay(prompt);
      } else {
        console.log("No prompt returned.");
        // 可能在这里设置一个错误信息状态来显示给用户
      }
    } catch (error) {
      console.error("Error sending prompt:", error);
      // 这里可以设置一个错误状态，告知用户获取提示词失败
    }
  };

  return (
    <div className="chat-page-container">
      <ChatHeader
        connectionStatus="Connected"
        onClearChat={() => console.log("Clear chat!")}
      />

      <div className="chat-content">
        <h2>聊天</h2>
        <button onClick={handleSendPrompt}>获取提示词</button>
        <p id="promptDisplay">
          Prompt: {promptToDisplay ? promptToDisplay : "No prompt available"}
        </p>
      </div>
    </div>
  );
};

export default ChatPage;
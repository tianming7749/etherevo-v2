/*
import express from 'express';
import { SupabaseClient } from '@supabase/supabase-js'; // 假设你使用了这个类型
import { supabase } from '../supabaseClient'; // 确保这个导入路径是正确的
import { addChatMessage } from '../services/chatHistoryService';

const router = express.Router();

// 获取聊天历史的路由
router.post("/api/chat/history", async (req: express.Request, res: express.Response) => {
  const { user_id, ai_id } = req.body;

  try {
    const { data: chatHistory, error } = await supabase
      .from("chat_history")
      .select("message, sender, created_at")
      .eq("user_id", user_id)
      .eq("ai_id", ai_id)
      .order("created_at", { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json(chatHistory);
  } catch (err) {
    console.error("Error fetching chat history:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 接收新消息的路由
router.post("/api/chat/message", async (req: express.Request, res: express.Response) => {
  const { user_id, message, sender } = req.body;

  try {
    if (!user_id || !message || !sender) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await addChatMessage(user_id, message, sender);

    res.status(201).json({ message: 'Message saved successfully' });
  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

export default router;
*/
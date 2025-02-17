// MemoryService.ts
import { supabase } from '../../supabaseClient';
import { summarizeChat } from '../../services/chatSummaryService';

/**
 * 从数据库加载特定用户和会话的长期记忆。
 * @param {string} userId - 用户的唯一标识符
 * @param {string} sessionId - 会话的唯一标识符
 * @returns {Promise<any>} - 长期记忆数据的承诺
 */
export const loadLongTermMemory = async (userId: string, sessionId: string) => {
  try {
    const { data, error } = await supabase
      .from('memory_archive')
      .select('memory_data')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .order('last_update', { ascending: false })
      .limit(2);

    if (error) {
      console.error('Error loading long term memory:', error);
      throw error;
    }
    console.log('Long term memories loaded for session:', sessionId, 'Count:', data.length);
    return data.map(item => item.memory_data); // 直接返回memory_data数组
  } catch (error) {
    console.error('Failed to load long term memory:', error);
    throw error;
  }
};

/**
 * 决定是否需要对当前会话进行总结。
 * @param {Object} sessionInfo - 包含会话相关信息的对象
 * @returns {boolean} - 如果需要总结会话返回true，否则返回false
 */
export const shouldSummarizeSession = (sessionInfo: { messageCount: number, lastMessageTime: Date }) => {
  // 示例逻辑：如果会话中有超过10条消息或上一条消息超过5分钟前，就总结会话
  const currentTime = new Date();
  const shouldSummarize = sessionInfo.messageCount > 10 || 
                          (currentTime.getTime() - sessionInfo.lastMessageTime.getTime() > 5 * 60 * 1000);
  
  console.log('Should summarize session:', shouldSummarize);
  return shouldSummarize;
};

/**
 * 根据需要对会话进行总结。
 * @param {string} userId - 用户的唯一标识符
 * @param {string} sessionId - 会话的唯一标识符
 */
export const summarizeIfNeeded = async (userId: string, sessionId: string, sessionInfo: { messageCount: number, lastMessageTime: Date }) => {
  if (shouldSummarizeSession(sessionInfo)) {
    console.log('Summarizing chat for session:', sessionId);
    await summarizeChat(userId, sessionId);
    console.log('Chat summarized successfully');
  } else {
    console.log('Chat summarization not needed for session:', sessionId);
  }
};
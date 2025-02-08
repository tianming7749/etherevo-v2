// ChatUtils.ts
import { v4 as uuidv4 } from 'uuid';

/**
 * 生成新的会话ID。
 * @returns {string} 一个新的UUID作为会话ID
 */
export const generateSessionId = () => {
  const newId = uuidv4();
  console.log('New sessionId generated:', newId);
  return newId;
};

/**
 * 处理流式响应的逻辑。
 * @param {Object} options - 流式响应处理的选项
 * @param {Function} callback - 每接收到一个数据块时调用的回调函数
 * @returns {Promise<void>}
 */
export const handleStreamedResponse = async (url: string, options: any, callback: (chunk: string) => void): Promise<void> => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      callback(chunk);
    }
  } catch (error) {
    console.error('Error in handleStreamedResponse:', error);
    // 这里可以选择是否需要重新抛出错误，或进行其他错误处理
    throw error;
  }
};
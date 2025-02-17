// EmotionAnalysisService.ts
import { v4 as uuidv4 } from 'uuid';

interface EmotionResult {
  emotion: string;
  score?: number;
  description?: string; // ✅  添加 description 字段到 EmotionResult 接口
}

// Helper function to add retry logic to fetch calls (保持不变)
async function fetchWithRetry(url: string, options: RequestInit, retryCount: number = 3, delay: number = 1000): Promise<Response> {
  for (let i = 0; i < retryCount; i++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (i === retryCount - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

// **🚀 修改点 1:  更新 API Endpoint 为通义千问 OpenAI 兼容模式  🚀**
const tongyiEndpoint = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

// **✅  修改 analyzeEmotion 函数，添加 apiKey 参数  ✅**
export async function analyzeEmotion(apiKey: string, text: string): Promise<EmotionResult> {
  try {
    // **🚀 修改点 2:  使用通义千问 API Endpoint 和 请求体， 并传递 apiKey  🚀**
    const response = await fetchWithRetry(tongyiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`, // **✅  添加 Authorization 标头，并使用 apiKey 参数  ✅**
      },
      body: JSON.stringify({
        // **✅  请求体参数适配通义千问 API (OpenAI 兼容模式)  ✅**
        model: "llama3.1-70b-instruct", // **✅  使用通义千问 plus 模型 (请根据实际模型名称调整)  ✅**
        messages: [{
          role: "user",
          content: `Analyze the emotion in this text and return the emotion name and a short description of why you think this is the emotion: "${text}"` //  ✅  更明确的情绪分析指令，要求描述
        }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response details from Emotion Analysis API:', { //  ✅ 更清晰的日志信息
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      throw new Error(`Emotion Analysis API failed: ${response.statusText}. Details: ${errorText}`); //  ✅ 更清晰的错误信息
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    let emotion = 'neutral'; // Default value
    let score: number | undefined;
    let description: string | undefined = "No detailed description from AI."; //  ✅ 初始化 description

    // **🚀 修改点 3:  更精细的情绪解析逻辑， 从 AI 回复内容中提取情绪和描述  🚀**
    //  以下是一个更健壮的解析逻辑示例，可以根据通义千问实际的回复格式进行调整
    const emotionKeywords = {
      lonely: ['lonely', '寂寞', '孤独'],
      sad: ['sad', '悲伤', '难过', '伤心'],
      happy: ['happy', '高兴', '开心', '愉快', ' радостный'],
      angry: ['angry', '愤怒', '生气', '恼火', ' злой'],
      surprised: ['surprised', '惊讶', '惊奇', 'удивленный'],
      disgusted: ['disgusted', '厌恶', '反感', 'отвращение'],
      fearful: ['fearful', '恐惧', '害怕', 'страх'],
      excited: ['excited', '兴奋', '激动', 'волнение'],
      confused: ['confused', '困惑', '迷茫', 'недоумение'],
      neutral: ['neutral', '中性', '平和', 'спокойный', 'безэмоциональный', '淡定'] //  ✅ 添加 neutral 关键词
    };


    for (const emotionType in emotionKeywords) {
      const keywords = emotionKeywords[emotionType];
      if (keywords.some(keyword => content.toLowerCase().includes(keyword))) {
        emotion = emotionType;
        break; //  ✅  找到匹配的情绪后跳出循环
      }
    }

    // 提取情绪描述 (假设通义千问会在回复中包含描述，需要根据实际情况调整提取逻辑)
    const descriptionMatch = content.match(/Description:\s*([\s\S]+)/i); //  ✅  使用正则表达式尝试匹配 "Description:" 后面的内容
    if (descriptionMatch && descriptionMatch[1]) {
      description = descriptionMatch[1].trim(); //  ✅  提取匹配到的描述内容
    } else {
      description = content; //  ✅  如果没找到 "Description:" 标签，  则将整个 content 作为描述 (兜底策略)
    }


    score = 1.0; // Score 默认为 1.0， 可以根据更精细的情绪强度分析来调整

    return {
      emotion,
      score,
      description // ✅ 返回 description
    };
  } catch (error) {
    console.error('Detailed error in emotion analysis:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date(),
      userText: text, // Log the user input causing the error
      networkInfo: navigator.connection ? {
        type: navigator.connection.type,
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink
      } : null,
    });
    throw error;
  }
}
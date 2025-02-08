// EmotionAnalysisService.ts
import { v4 as uuidv4 } from 'uuid';

interface EmotionResult {
  emotion: string;
  score?: number;
}

// Helper function to add retry logic to fetch calls
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

export async function analyzeEmotion(text: string): Promise<EmotionResult> {
  try {
    const response = await fetchWithRetry('http://192.168.1.14:1234/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "meta-llama-3.1-8b-instruct@8bit",
        messages: [{ role: "user", content: `Analyze the emotion in this text: "${text}"` }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response details:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      throw new Error(`Failed to analyze emotion: ${response.statusText}. Details: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    let emotion = 'neutral'; // Default value
    let score: number | undefined;

    // Based on AI's text analysis, infer the main emotion
    if (content.toLowerCase().includes('lonely') || content.toLowerCase().includes('寂寞')) {
      emotion = 'lonely';
    } else if (content.toLowerCase().includes('sad') || content.toLowerCase().includes('悲伤')) {
      emotion = 'sad';
    } else if (content.toLowerCase().includes('happy') || content.toLowerCase().includes('高兴')) {
      emotion = 'happy';
    } else if (content.toLowerCase().includes('angry') || content.toLowerCase().includes('愤怒')) {
      emotion = 'angry';
    } else if (content.toLowerCase().includes('surprised') || content.toLowerCase().includes('惊讶')) {
      emotion = 'surprised';
    } else if (content.toLowerCase().includes('disgusted') || content.toLowerCase().includes('厌恶')) {
      emotion = 'disgusted';
    } else if (content.toLowerCase().includes('fearful') || content.toLowerCase().includes('恐惧')) {
      emotion = 'fearful';
    } else if (content.toLowerCase().includes('excited') || content.toLowerCase().includes('兴奋')) {
      emotion = 'excited';
    } else if (content.toLowerCase().includes('confused') || content.toLowerCase().includes('困惑')) {
      emotion = 'confused';
    }
    // Additional emotion keywords can be added here

    // Score logic based on content intensity
    if (content.toLowerCase().includes('a bit') || content.toLowerCase().includes('有点儿')) {
      score = 0.5; // Medium intensity
    } else {
      score = 1.0; // High intensity assumed if not specified
    }

    return {
      emotion,
      score
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
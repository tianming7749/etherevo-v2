// services/StreamService.ts

export const handleStreamedResponse = async (url: string, data: any, onMessage: (chunk: string, isFirstChunk: boolean) => void) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const reader = response.body.getReader();
    let receivedText = '';
    let isFirstChunk = true;

    // 读取数据流
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      receivedText += new TextDecoder("utf-8").decode(value);
      // 处理接收到的文本
      if (receivedText.includes('\n')) { // 假设每个块以换行符结束
        const lines = receivedText.split('\n');
        for (const line of lines) {
          if (line.trim() !== '') {
            // 移除 'data:' 前缀
            const jsonLine = line.replace(/^data:\s*/, '');
            if (jsonLine !== '[DONE]') {
              try {
                const parsedLine = JSON.parse(jsonLine);
                if (parsedLine.choices && parsedLine.choices[0] && parsedLine.choices[0].delta) {
                  const delta = parsedLine.choices[0].delta.content || '';
                  onMessage(delta, isFirstChunk); // 回调函数调用，传递内容和是否是第一个块
                  isFirstChunk = false;
                }
              } catch (e) {
                console.error('Failed to parse line:', line, e);
              }
            }
          }
        }
        receivedText = ''; // 重置接收的文本
      }
    }
  } catch (error) {
    console.error("Error handling stream:", error);
    throw error; // 让调用者可以处理错误
  }
};
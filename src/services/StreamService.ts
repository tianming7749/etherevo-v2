// services/StreamService.ts

export const handleStreamedResponse = async (apiKey: string, url: string, data: any, onMessage: (chunk: string, isFirstChunk: boolean) => void) => { // ✅ 添加 apiKey 作为第一个参数
  try {
     // **🚀 添加 console.log 语句， 打印 apiKey 🚀**
     console.log("StreamService - apiKey before fetch:", apiKey); // ✅ 现在应该正确记录 apiKey 参数

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`, //  👈 **✅  关键修改： 添加 Authorization 标头， 并使用 apiKey 参数  ✅**
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      console.error('Network response was not ok');
      // **🚀  添加更详细的错误日志  🚀**
      console.error('Response status:', response.status); //  👈  打印 HTTP 状态码
      console.error('Response text:', await response.text()); //  👈  打印响应文本内容
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
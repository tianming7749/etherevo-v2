/*
import React, { useEffect, useState } from "react";
import { supabase } from "/src/supabaseClient";
import { savePromptToDatabase } from "/src/utils/supabaseHelpers";

const UserBasicInfoPrompts = () => {
  const [prompt, setPrompt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserInfo = async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("未找到用户");

      const { data, error } = await supabase
        .from("user_basic_info")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        const promptText = `
与你交谈的用户基本信息如下：
名为 ${data.name || "未知"}
年龄在 ${data.age_group || "未知"} 范围
性别为 ${data.gender || "未知"}
从事 ${data.occupation || "未知"}
目前居住在 ${data.current_location || "未知"}
出生于 ${data.birth_location || "未知"}
教育程度为 ${data.education || "未知"}
宗教信仰为 ${data.religions || "未知"}
        `.trim();

        setPrompt(promptText);

        // 保存到数据库
        await savePromptToDatabase(user.id, "basic_info", promptText);
      } else {
        setPrompt(null);
      }
    } catch (err: any) {
      console.error("Error fetching user info:", err);
      setError(err.message || "无法获取数据");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  return (
    <div>
      <h1>用户基本信息提示词</h1>
      {loading && <p>加载中...</p>}
      {error && <p>未能生成提示词：{error}</p>}
      {prompt && (
        <div
          style={{
            whiteSpace: "pre-line",
            fontFamily: "Arial, sans-serif",
            lineHeight: "1.6",
          }}
        >
          {prompt}
        </div>
      )}
    </div>
  );
};

export default UserBasicInfoPrompts;
*/
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../../supabaseClient";
import { generatePromptsForUser } from "../../../utils/generatePrompts";  
import { useUserContext } from "../../../context/UserContext";
import "./InterestsPage.css";

const interestsData = {
  "艺术与创意": [
    "绘画", "雕塑", "摄影", "音乐创作", "演奏乐器", "写作", "电影制作", "戏剧表演"
  ],
  "体育与健身": [
    "跑步", "游泳", "健身房训练", "瑜伽", "户外运动（登山、徒步）", "自行车运动", "团队运动（足球、篮球等）", "武术"
  ],
  "社交与娱乐": [
    "聚会", "旅行", "烹饪", "酒吧/咖啡馆体验", "电子竞技/游戏", "看体育赛事", "娱乐活动（音乐会、展览）", "读书俱乐部"
  ],
  "科技与创新": [
    "编程", "电子产品爱好者", "技术博客/播客", "机器人技术", "3D打印", "虚拟现实", "增强现实", "开源项目参与"
  ],
  "学习与知识": [
    "在线教育", "学术研究", "语言学习", "科学实验", "历史研究", "哲学讨论", "艺术史", "文化研究"
  ],
  "手工与工艺": [
    "编织", "缝纫", "木工", "园艺", "陶艺", "珠宝制作", "DIY家居装饰", "模型制作"
  ],
  "身心健康": [
    "冥想", "心理健康实践", "营养学", "自然疗法", "瑜伽", "太极", "健康管理", "减压技巧"
  ],
  "媒体与流行文化": [
    "电影/电视剧", "播客", "音乐听赏", "流行文化追踪", "动漫/漫画", "社交媒体内容创作", "直播", "流行文化讨论"
  ]
};

const InterestsPage: React.FC = () => {
  const { userId, loading } = useUserContext();
  const [userInterests, setUserInterests] = useState<Record<string, string[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement>>({});

  // Fetch interests from database
  useEffect(() => {
    const fetchInterests = async () => {
      if (!userId) return;

      const { data, error } = await supabase
        .from("user_interests")
        .select("interests")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error fetching interests:", error);
      } else if (data) {
        const savedInterests = JSON.parse(data.interests);
        const updatedInterests = { ...savedInterests };

        // Ensure all pre-defined categories are present
        Object.keys(interestsData).forEach((category) => {
          if (!updatedInterests[category]) {
            updatedInterests[category] = [];
          }
        });

        setUserInterests(updatedInterests);
      }
    };

    fetchInterests();
  }, [userId]);

  // Update interests on checkbox change
  const handleInterestChange = (category: string, interest: string, isChecked: boolean) => {
    const updatedCategory = userInterests[category] || [];
    const updatedInterests = isChecked
      ? [...new Set([...updatedCategory, interest])]
      : updatedCategory.filter((i) => i !== interest);

    setUserInterests((prev) => ({ ...prev, [category]: updatedInterests }));
  };

  // Add unsaved input to userInterests before saving
  const addUnsavedInputs = () => {
    const updatedInterests = { ...userInterests };

    Object.entries(inputRefs.current).forEach(([category, input]) => {
      const newInterest = input.value.trim();
      if (newInterest) {
        if (!updatedInterests[category]?.includes(newInterest)) {
          updatedInterests[category] = [...(updatedInterests[category] || []), newInterest];
          // 不清空输入框，保持原样
        } else {
          console.warn("这个兴趣已经存在于列表中！"); // 只在控制台警告，不弹出alert
        }
      }
    });
    setUserInterests(updatedInterests); // 一次性更新所有输入框的内容
  };

  // Save interests to database
  const saveInterests = async () => {
    if (!userId) return;
  
    addUnsavedInputs(); // 确保未保存的输入已添加
  
    // 使用回调确保状态更新后再保存
    setUserInterests(prevState => {
      console.log('状态更新后准备保存的兴趣:', prevState);
      saveData(prevState);
      return prevState; // 返回当前状态以触发更新
    });

    async function saveData(updatedState) {
      setIsSaving(true);
    
      try {
        console.log('准备保存的兴趣（JSON）:', JSON.stringify(updatedState));

        const { error } = await supabase
          .from("user_interests")
          .upsert(
            {
              user_id: userId,
              interests: JSON.stringify(updatedState),
            },
            { onConflict: "user_id" } // 确保唯一冲突列为 user_id
          );
    
        if (error) {
          console.error("Error saving interests:", error);
          alert("保存兴趣失败，请稍后重试！");
          return;
        }
    
        console.log("Interests saved successfully!");
        alert("保存成功！");

        // Step 3: 生成提示词并保存
        const updatedPrompt = await generatePromptsForUser(userId);
        console.log("生成的提示词:", updatedPrompt);

        // Step 4: 保存提示词到数据库
        const { error: savePromptError } = await supabase
            .from("user_prompts_summary")
            .upsert({
              user_id: userId,
              full_prompt: updatedPrompt,
            },
            { onConflict: ["user_id"] }  // 确保只有相同 user_id 的记录才会被更新
          );

        if (savePromptError) {
          console.error("保存提示词失败：", savePromptError.message);
        } else {
          console.log("提示词已成功保存");
        }

        // 清空所有输入框
        Object.values(inputRefs.current).forEach(input => input.value = "");

        // 重新获取数据来验证是否保存成功
        const { data: checkData, error: checkError } = await supabase
          .from("user_interests")
          .select("interests")
          .eq("user_id", userId)
          .single();

        if (checkError) {
          console.error("检查保存数据时出错:", checkError);
        } else {
          console.log("保存后检查到的数据:", checkData);
        }

        // 提示用户保存成功
      } catch (error) {
        console.error("保存过程中发生错误：", error);
        alert("保存失败，请检查网络连接或稍后重试！");
      } finally {
        setIsSaving(false); // 重置保存状态
      }
    };
  };

  if (loading) {
    return <p className="loading-message">加载中...</p>;
  }
  
  return (
    <div className="interests-page">
      <h2>兴趣与爱好</h2>
      <div className="interests-grid">
        {Object.entries(interestsData).map(([category, interests]) => (
          <div key={category} className="interest-category">
            <h3>{category}</h3>
            <ul>
              {interests.map((interest) => (
                <li key={interest}>
                  <label>
                    <input
                      type="checkbox"
                      checked={userInterests[category]?.includes(interest) || false}
                      onChange={(e) => handleInterestChange(category, interest, e.target.checked)}
                    />
                    {interest}
                  </label>
                </li>
              ))}
              {/* Display additional interests */}
              {userInterests[category]
                ?.filter((interest) => !interests.includes(interest))
                .map((extraInterest) => (
                  <li key={extraInterest}>
                    <label>
                      <input
                        type="checkbox"
                        checked
                        onChange={(e) => handleInterestChange(category, extraInterest, e.target.checked)}
                      />
                      {extraInterest}
                    </label>
                  </li>
                ))}
            </ul>
            <input
              type="text"
              placeholder="添加其他兴趣"
              ref={(el) => (el ? (inputRefs.current[category] = el) : delete inputRefs.current[category])}
            />
          </div>
        ))}
      </div>
      <button onClick={saveInterests} disabled={isSaving}>
        {isSaving ? "保存中..." : "保存"}
      </button>
    </div>
  );
};

export default InterestsPage;
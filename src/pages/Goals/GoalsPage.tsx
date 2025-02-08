import React, { useState, useEffect } from "react";
import { useUserContext } from "../../context/UserContext";
import { saveUserGoals, fetchUserGoals } from "../../utils/supabaseHelpers";
import { generatePromptsForUser } from "../../utils/generatePrompts";
import { supabase } from "../../supabaseClient";
import "./GoalsPage.css"; // 导入CSS文件

const GoalsPage: React.FC = () => {
  const { userId } = useUserContext();
  const [goals, setGoals] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const predefinedGoals = [
    "减轻焦虑",
    "改善抑郁情绪",
    "增强社交技能",
    "提升自我认知",
    "学习应对压力技巧",
    "改善睡眠质量",
    "提高生活满意度",
    "增强情绪调节能力",
    "建立或改善人际关系",
    "提升自信",
    "培养积极的心态",
    "管理愤怒或其他负面情绪",
  ];

  useEffect(() => {
    const loadUserGoals = async () => {
      setError(null); // 清除错误信息
      try {
        const savedGoals = await fetchUserGoals(userId);
        
        // 确保 savedGoals 是一个数组，如果不是，则尝试将其解析为数组
        let parsedGoals = [];
        if (Array.isArray(savedGoals)) {
          parsedGoals = savedGoals;
        } else if (typeof savedGoals === 'string') {
          try {
            parsedGoals = JSON.parse(savedGoals);
          } catch (e) {
            console.error("解析存储的目标时出错：", e);
          }
        }
        setGoals(Array.isArray(parsedGoals) ? parsedGoals : []);
      } catch (err) {
        console.error("加载用户目标时出错：", err);
        setError("加载目标时发生错误，请稍后重试。");
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadUserGoals();
    }
  }, [userId]);

  const handleGoalSelection = (goal: string) => {
    setGoals((prevGoals) => {
      // 使用 Array.isArray 来确保 prevGoals 是数组
      if (!Array.isArray(prevGoals)) {
        console.error("prevGoals 不是数组：", prevGoals);
        return [goal]; // 如果不是数组，则返回一个包含当前选择的目标的数组
      }

      if (prevGoals.includes(goal)) {
        return prevGoals.filter((g) => g !== goal);
      } else if (prevGoals.length < 3) {
        return [...prevGoals, goal];
      } else {
        alert("最多只能选择 3 个目标！");
        return prevGoals;
      }
    });
  };

  const handleSaveGoals = async () => {
    try {
      await saveUserGoals(userId, JSON.stringify(goals));
      alert("目标已保存！");

      const updatedPrompt = await generatePromptsForUser(userId);
      if (updatedPrompt) {
        await saveUserPrompt(userId, updatedPrompt);
        console.log("提示词已更新并保存。");
      } else {
        console.warn("未能生成或保存新的提示词。");
      }
    } catch (err) {
      console.error("保存目标或更新提示词时出错：", err);
      alert("保存目标或更新提示词时发生错误，请稍后再试。");
    }
  };

  if (!userId) return <p>请先登录以查看和设置你的目标。</p>;

  return (
    <div className="goals-page">
      <h1>设定你的目标</h1>
      <p>
        提示：设定你的目标可以帮助我们为你量身定制心理健康支持。你可以选择最多3个目标，以便我们专注于重要的事情。随时可以调整你的目标以适应你的需求变化。
      </p>
      {error && <p className="error-message">{error}</p>}
      <div>
        {predefinedGoals.map((goal) => (
          <div key={goal} className="goal-item">
            <label>
              <input
                type="checkbox"
                checked={goals.includes(goal)}
                onChange={() => handleGoalSelection(goal)}
                disabled={isLoading}
              />
              {goal}
            </label>
          </div>
        ))}
      </div>
      <button
        onClick={handleSaveGoals}
        disabled={goals.length === 0}
      >
        保存目标
      </button>
    </div>
  );
};

// 保存提示词的辅助函数
async function saveUserPrompt(userId: string, prompt: string) {
  try {
    const { error } = await supabase
      .from("user_prompts_summary")
      .upsert({
        user_id: userId,
        full_prompt: prompt,
      },
      { onConflict: ["user_id"] });
    
    if (error) throw error;
  } catch (err) {
    console.error("保存提示词失败：", err.message);
  }
}

export default GoalsPage;
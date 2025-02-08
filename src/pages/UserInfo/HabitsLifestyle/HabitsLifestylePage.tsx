import React, { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import { generatePromptsForUser } from "../../../utils/generatePrompts";  // 引入生成提示词的功能
import { useUserContext } from "../../../context/UserContext";
import "./HabitsLifestylePage.css";

const HabitsLifestylePage: React.FC = () => {
  const { userId, loading } = useUserContext();
  const [habits, setHabits] = useState({
    sleep: {
      sleepTime: "",
      wakeTime: "",
      sleepQuality: "",
    },
    exercise: {
      frequency: "",
      type: "",
      duration: "",
      intensity: "",
    },
    diet: {
      meals: "",
      dietType: "",
      waterIntake: "",
      snacks: "",
    },
  });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch data from database
  useEffect(() => {
    const fetchHabits = async () => {
      if (!userId) return;

      const { data, error } = await supabase
        .from("user_habits_lifestyle")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching habits:", error);
      } else if (data) {
        setHabits(data.habits || habits); // 使用数据库中的习惯数据，或保持默认值
      } else {
        console.log("No habits found. Initializing default habits...");
        await supabase.from("user_habits_lifestyle").insert({
          user_id: userId,
          habits,
        });
      }
    };

    fetchHabits();
  }, [userId]);

  // Save habits to database
  const saveHabits = async () => {
    if (!userId) return;
  
    setIsSaving(true);
  
    try {
      // Step 1: 保存日常习惯和生活方式数据到数据库
      const { error } = await supabase
        .from("user_habits_lifestyle")
        .upsert(
          {
            user_id: userId,
            habits,
          },
          { onConflict: "user_id" }
        );
  
      if (error) {
        console.error("Error saving habits:", error);
        alert("保存日常习惯失败，请稍后重试！");
        return;
      }
  
      console.log("Habits saved successfully!");

      alert("保存成功！");

      // Step 3: 生成提示词并保存（不使用 ai_id）
    const updatedPrompt = await generatePromptsForUser(userId);

    // Step 4: 保存提示词到数据库（去掉 ai_id 相关信息）
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

    // 提示用户保存成功
    } catch (error) {
    console.error("保存过程中发生错误：", error);
    alert("保存失败，请检查网络连接或稍后重试！");
    } finally {
    setIsSaving(false); // 重置保存状态
    }
  };

  if (loading) return <div>Loading...</div>;

  const handleChange = (
    category: string,
    key: string,
    value: string
  ) => {
    setHabits((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const renderSelect = (
    label: string,
    category: string,
    key: string,
    options: string[]
  ) => (
    <label>
      {label}
      <select
        value={habits[category][key]}
        onChange={(e) => handleChange(category, key, e.target.value)}
      >
        <option value="">请选择</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="habits-lifestyle-page">
      <h2>日常习惯和生活方式</h2>

      <div>
        <h3>睡眠模式</h3>
        {renderSelect("平时几点睡觉？", "sleep", "sleepTime", [
          "21:00-22:00",
          "22:00-23:00",
          "23:00-00:00",
          "00:00之后",
        ])}
        {renderSelect("平时几点起床？", "sleep", "wakeTime", [
          "5:00-6:00",
          "6:00-7:00",
          "7:00-8:00",
          "8:00之后",
        ])}
        {renderSelect("睡眠质量如何？", "sleep", "sleepQuality", [
          "差",
          "一般",
          "好",
          "非常好",
        ])}
        
      </div>

      <div>
        <h3>锻炼习惯</h3>
        {renderSelect("每周锻炼频率？", "exercise", "frequency", [
          "没有",
          "1-2次",
          "3-4次",
          "5次以上",
        ])}
        {renderSelect("主要锻炼类型？", "exercise", "type", [
          "有氧",
          "力量",
          "瑜伽",
          "其他",
        ])}
        {renderSelect("每次锻炼时长？", "exercise", "duration", [
          "少于30分钟",
          "30-60分钟",
          "1小时以上",
        ])}
        {renderSelect("锻炼强度？", "exercise", "intensity", [
          "轻",
          "中等",
          "重",
        ])}
      </div>

      <div>
        <h3>饮食习惯</h3>
        {renderSelect("每天吃几餐？", "diet", "meals", [
          "1-2餐",
          "3餐",
          "3餐以上",
        ])}
        {renderSelect("饮食结构偏向？", "diet", "dietType", [
          "肉食为主",
          "素食为主",
          "混合均衡",
        ])}
        {renderSelect("每日水摄入量？", "diet", "waterIntake", [
          "少于1升",
          "1-2升",
          "2升以上",
        ])}
        {renderSelect("零食习惯？", "diet", "snacks", [
          "无",
          "很少",
          "偶尔",
          "经常",
        ])}
      </div>

      <button onClick={saveHabits} disabled={isSaving}>
        {isSaving ? "保存中..." : "保存"}
      </button>
    </div>
  );
};

export default HabitsLifestylePage;
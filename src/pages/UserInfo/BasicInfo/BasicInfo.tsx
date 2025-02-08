import React, { useState, useEffect } from "react";
import { saveBasicInfo } from "../../../api/userInfo";
import { supabase } from "../../../supabaseClient";
import { generatePromptsForUser } from "../../../utils/generatePrompts";  // 引入生成提示词的功能
import NameInput from "./NameInput";
import AgeSelector from "./AgeSelector";
import GenderSelector from "./GenderSelector";
import OccupationSelector from "./OccupationSelector";
import LocationSelector from "./LocationSelector";
import EducationSelector from "./EducationSelector";
import ReligionsSelector from "./ReligionsSelector";
import "./BasicInfo.css";

const BasicInfo: React.FC = () => {
  const [basicInfo, setBasicInfo] = useState({
    name: "",
    age_group: "",
    gender: "",
    gender_other: "",
    occupation: "",
    occupation_other: "",
    current_location: "",
    birth_location: "",
    education: "",
    education_other: "",
    religions: "",
  });

  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // 新增状态，用于管理加载状态

  // 获取当前用户的 user_id
  useEffect(() => {
    const fetchUserId = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error.message);
      } else {
        setUserId(data?.user?.id || null);
      }
    };

    fetchUserId();
  }, []);

  // 加载用户基本信息
  useEffect(() => {
    const fetchBasicInfo = async () => {
      if (!userId) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("user_basic_info")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (error) {
          console.error("Error fetching basic info:", error.message);
        } else if (data) {
          setBasicInfo({
            name: data.name || "",
            age_group: data.age_group || "",
            gender: data.gender || "",
            gender_other: data.gender_other || "",
            occupation: data.occupation || "",
            occupation_other: data.occupation_other || "",
            current_location: data.current_location || "",
            birth_location: data.birth_location || "",
            education: data.education || "",
            education_other: data.education_other || "",
            religions: data.religions || "",
          });
        }
      } catch (err) {
        console.error("Error loading basic info:", err);
      } finally {
        setIsLoading(false); // 数据加载完成
      }
    };

    fetchBasicInfo();
  }, [userId]);

  const handleFieldChange = (field: string, value: string) => {
    setBasicInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!userId) {
      alert("用户未登录，请先登录！");
      return;
    }

    try {
      // Step 1: 保存基本信息到数据库
      const result = await saveBasicInfo({ ...basicInfo, user_id: userId });
  
      if (!result.success) {
        alert("保存失败，请重试！");
        return;
      }

      alert("保存成功！");

      // Step 3: 生成提示词并保存（不使用 ai_id）
      // 假设这里有一个新的函数或方法来生成提示词，不依赖于 ai_id
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
      //alert("保存成功！");
    } catch (error) {
      console.error("保存失败：", error);
      alert("保存过程中出错，请稍后重试！");
    }
  };

  return (
    <div className="basic-info-container">
      <h2>基本信息</h2>
      <NameInput value={basicInfo.name} onChange={(value) => handleFieldChange("name", value)} />
      <AgeSelector value={basicInfo.age_group} onChange={(value) => handleFieldChange("age_group", value)} />
      <GenderSelector
        value={basicInfo.gender}
        otherValue={basicInfo.gender_other}
        onChange={(field, value) => handleFieldChange(field, value)}
        onOtherChange={(value) => handleFieldChange("gender_other", value)}
      />
      <OccupationSelector
        value={basicInfo.occupation}
        otherValue={basicInfo.occupation_other}
        onChange={(field, value) => handleFieldChange(field, value)}
        onOtherChange={(value) => handleFieldChange("occupation_other", value)}
      />
      <LocationSelector
        currentLocation={basicInfo.current_location}
        birthLocation={basicInfo.birth_location}
        onChange={(field, value) => handleFieldChange(field, value)}
        onBirthChange={(value) => handleFieldChange("birth_location", value)}
      />
      <EducationSelector
        value={basicInfo.education}
        otherValue={basicInfo.education_other}
        onChange={(value) => handleFieldChange("education", value)}
        onOtherChange={(value) => handleFieldChange("education_other", value)}
      />
      <ReligionsSelector
        value={basicInfo.religions}
        otherValue={basicInfo.Religions_other}
        onChange={(value) => handleFieldChange("religions", value)}
        onOtherChange={(value) => handleFieldChange("religions_other", value)}
      />
      <button onClick={handleSave}>保存</button>
    </div>
  );
};

export default BasicInfo;
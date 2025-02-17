import React, { useState, useEffect } from "react";
import { generatePromptsForUser } from "../../../utils/generatePrompts";  // 引入生成提示词的功能
import { useUserContext } from "../../../context/UserContext";
import { supabase } from "../../../supabaseClient";
import "./SocialSupportPage.css"; // 导入样式文件

const SocialSupportPage: React.FC = () => {
  const { userId } = useUserContext();
  const [socialSupport, setSocialSupport] = useState<any>({
    friends: "",
    family: "",
    meetFrequency: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch data from the database
  useEffect(() => {
    const fetchSocialSupport = async () => {
      if (!userId) return;

      const { data, error } = await supabase
        .from("user_social_support")
        .select("social_support")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No record found, create default entry
          const { error: insertError } = await supabase
            .from("user_social_support")
            .insert({
              user_id: userId,
              social_support: {},
            });

          if (insertError) console.error("Error inserting default data:", insertError);
          else setSocialSupport({});
        } else {
          console.error("Error fetching social support:", error);
        }
      } else if (data && data.social_support) {
        setSocialSupport({
          friends: data.social_support.friends || "",
          family: data.social_support.family || "",
          meetFrequency: data.social_support.meetFrequency || "",
        });
      }
    };

    fetchSocialSupport();
  }, [userId]);

  // Save data to the database
  const saveSocialSupport = async () => {
    if (!userId) return;

    setIsSaving(true);

    try {
      // Step 1: 保存社交支持数据到数据库
      const { error } = await supabase
        .from("user_social_support")
        .upsert(
          {
            user_id: userId,
            social_support: { //  <--  手动创建 social_support 对象
              friends: socialSupport.friends,
              family: socialSupport.family,
              meetFrequency: socialSupport.meetFrequency,
            },
          },
          { onConflict: "user_id" }
        );

      if (error) {
        console.error("Error saving social support:", error);
        alert("保存社交支持失败，请稍后重试！");
        return;
      }

      console.log("Social support saved successfully!");
      alert("保存成功！");

      const updatedPrompt = await generatePromptsForUser(userId);

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

  // Render form
  return (
    <div className="social-support-container">
      <h2>Social Support System</h2>
      <form>
        {/* Social Network Size */}
        <h3>Social Network Size</h3>
        <label>
          Number of close friends:
          <select
            value={socialSupport.friends || ""}
            onChange={(e) => setSocialSupport({ ...socialSupport, friends: e.target.value })}
          >
            <option value="">Select</option>
            <option value="0">0</option>
            <option value="1-3">1-3</option>
            <option value="4-10">4-10</option>
            <option value="10+">10+</option>
          </select>
        </label>
        <label>
          Number of family members regularly in contact:
          <select
            value={socialSupport.family || ""}
            onChange={(e) => setSocialSupport({ ...socialSupport, family: e.target.value })}
          >
            <option value="">Select</option>
            <option value="0">0</option>
            <option value="1-3">1-3</option>
            <option value="4-10">4-10</option>
            <option value="10+">10+</option>
          </select>
        </label>

        {/* Social Contact Frequency */}
        <h3>Social Contact Frequency</h3>
        <label>
          Frequency of meeting friends/family:
          <select
            value={socialSupport.meetFrequency || ""}
            onChange={(e) =>
              setSocialSupport({ ...socialSupport, meetFrequency: e.target.value })
            }
          >
            <option value="">Select</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="less">Less</option>
          </select>
        </label>


        {/* Submit Button */}
        <button type="button" onClick={saveSocialSupport} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
};

export default SocialSupportPage;
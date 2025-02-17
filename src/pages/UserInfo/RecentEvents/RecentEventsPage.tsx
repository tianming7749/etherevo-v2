import React, { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import { generatePromptsForUser } from "../../../utils/generatePrompts";  // 引入生成提示词的功能
import { useUserContext } from "../../../context/UserContext";
import "./RecentEventsPage.css";

const RecentEventsPage: React.FC = () => {
  const { userId, loading } = useUserContext();
  const [recentEvents, setRecentEvents] = useState({
    moving: false,
    jobChange: false,
    promotion: false,
    studyChange: false,
    marriage: false,
    newBaby: false,
    relationshipChange: false,
    bereavement: false,
    healthIssue: false,
    financialChange: false,
    other: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch data from database
  useEffect(() => {
    const fetchRecentEvents = async () => {
      if (!userId) return;

      const { data, error } = await supabase
        .from("user_recent_events")
        .select("recent_events")
        .eq("user_id", userId)
        .single();

        if (error) {
          if (error.code === "PGRST116") {
            // 没有匹配记录，插入默认值
            const { error: insertError } = await supabase
              .from("user_recent_events")
              .insert({
                user_id: userId,
                recent_events: {}, // 默认值
              });
    
            if (insertError) {
              console.error("Error inserting default recent events:", insertError);
            } else {
              console.log("Inserted default recent events.");
              setRecentEvents({}); // 设置为空对象
            }
          } else {
            console.error("Error fetching recent events:", error);
          }
        } else if (data) {
          setRecentEvents(data.recent_events);
      }
    };

    fetchRecentEvents();
  }, [userId]);

  // Save recent events to database
  const saveRecentEvents = async () => {
    if (!userId) return;
  
    setIsSaving(true);
  
    try {
      // Step 1: 保存近期生活事件数据到数据库
      const { error } = await supabase
        .from("user_recent_events")
        .upsert(
          {
            user_id: userId,
            recent_events: recentEvents,
          },
          { onConflict: "user_id" }
        );
  
      if (error) {
        console.error("Error saving recent events:", error);
        alert("保存近期生活事件失败，请稍后重试！");
        return;
      }
  
      console.log("Recent events saved successfully!");
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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="recent-events-page">
      <h2>近期的重大生活事件</h2>

      <div className="form-section">
        <h3>搬家</h3>
        <label>
          是否最近搬了新家？
          <input
            type="checkbox"
            checked={recentEvents.moving}
            onChange={(e) =>
              setRecentEvents((prev) => ({ ...prev, moving: e.target.checked }))
            }
          />
        </label>
      </div>

      <div className="form-section">
        <h3>工作或学业变化</h3>
        <label>
          失业或换工作？
          <input
            type="checkbox"
            checked={recentEvents.jobChange}
            onChange={(e) =>
              setRecentEvents((prev) => ({
                ...prev,
                jobChange: e.target.checked,
              }))
            }
          />
        </label>
        <label>
          升职或降职？
          <input
            type="checkbox"
            checked={recentEvents.promotion}
            onChange={(e) =>
              setRecentEvents((prev) => ({
                ...prev,
                promotion: e.target.checked,
              }))
            }
          />
        </label>
        <label>
          开始或结束学业？
          <input
            type="checkbox"
            checked={recentEvents.studyChange}
            onChange={(e) =>
              setRecentEvents((prev) => ({
                ...prev,
                studyChange: e.target.checked,
              }))
            }
          />
        </label>
      </div>

      <div className="form-section">
        <h3>人际关系</h3>
        <label>
          结婚或离婚？
          <input
            type="checkbox"
            checked={recentEvents.marriage}
            onChange={(e) =>
              setRecentEvents((prev) => ({
                ...prev,
                marriage: e.target.checked,
              }))
            }
          />
        </label>
        <label>
          新生儿的到来或孩子离家？
          <input
            type="checkbox"
            checked={recentEvents.newBaby}
            onChange={(e) =>
              setRecentEvents((prev) => ({
                ...prev,
                newBaby: e.target.checked,
              }))
            }
          />
        </label>
        <label>
          新的亲密关系或关系结束？
          <input
            type="checkbox"
            checked={recentEvents.relationshipChange}
            onChange={(e) =>
              setRecentEvents((prev) => ({
                ...prev,
                relationshipChange: e.target.checked,
              }))
            }
          />
        </label>
        <label>
          是否有亲人或非常亲近的朋友去世？
          <input
            type="checkbox"
            checked={recentEvents.bereavement}
            onChange={(e) =>
              setRecentEvents((prev) => ({
                ...prev,
                bereavement: e.target.checked,
              }))
            }
          />
        </label>
      </div>

      <div className="form-section">
        <h3>健康问题</h3>
        <label>
          是否自己或家人经历了重大健康问题或诊断？
          <input
            type="checkbox"
            checked={recentEvents.healthIssue}
            onChange={(e) =>
              setRecentEvents((prev) => ({
                ...prev,
                healthIssue: e.target.checked,
              }))
            }
          />
        </label>
      </div>

      <div className="form-section">
        <h3>财务状况变化</h3>
        <label>
          重大财务问题或改善？
          <input
            type="checkbox"
            checked={recentEvents.financialChange}
            onChange={(e) =>
              setRecentEvents((prev) => ({
                ...prev,
                financialChange: e.target.checked,
              }))
            }
          />
        </label>
      </div>

      <div className="form-section">
        <h3>其他重大事件</h3>
        <textarea
          placeholder="请描述其他未列出的重大事件"
          value={recentEvents.other}
          onChange={(e) =>
            setRecentEvents((prev) => ({ ...prev, other: e.target.value }))
          }
        />
      </div>

      <button onClick={saveRecentEvents} disabled={isSaving}>
        {isSaving ? "保存中..." : "保存"}
      </button>
    </div>
  );
};

export default RecentEventsPage;
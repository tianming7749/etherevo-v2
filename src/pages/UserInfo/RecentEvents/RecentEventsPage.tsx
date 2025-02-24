import React, { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import { generatePromptsForUser } from "../../../utils/generatePrompts";
import { useUserContext } from "../../../context/UserContext";
import "./RecentEventsPage.css";
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

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
          const { error: insertError } = await supabase
            .from("user_recent_events")
            .insert({
              user_id: userId,
              recent_events: {},
            });

          if (insertError) {
            console.error("Error inserting default recent events:", insertError);
          } else {
            console.log("Inserted default recent events.");
            setRecentEvents({
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

  const saveRecentEvents = async () => {
    if (!userId) return;

    setIsSaving(true);

    try {
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
        alert(t('recentEventsPage.saveErrorAlert'));
        return;
      }

      const updatedPrompt = await generatePromptsForUser(userId);

      const { error: savePromptError } = await supabase
        .from("user_prompts_summary")
        .upsert({
          user_id: userId,
          full_prompt: updatedPrompt,
        }, { onConflict: ["user_id"] });

      if (savePromptError) {
        console.error("保存提示词失败：", savePromptError.message);
      } else {
        console.log("提示词已成功保存");
      }

      alert(t('recentEventsPage.saveSuccessAlert'));
    } catch (error) {
      console.error("保存过程中发生错误：", error);
      alert(t('recentEventsPage.saveNetworkErrorAlert'));
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div>{t('recentEventsPage.loadingMessage')}</div>;

  return (
    <div className="recent-events-page">
      <div className="form-section">
        <h3>{t('recentEventsPage.sections.moving.title')}</h3>
        <label className="checkbox-label"> {/* 添加 className */}
          <input
            type="checkbox"
            checked={recentEvents.moving}
            onChange={(e) =>
              setRecentEvents((prev) => ({ ...prev, moving: e.target.checked }))
            }
          />
          <span>{t('recentEventsPage.sections.moving.label')}</span> {/* 使用 span 包裹文本 */}
        </label>
      </div>

      <div className="form-section">
        <h3>{t('recentEventsPage.sections.careerAndEducation.title')}</h3>
        <label className="checkbox-label"> {/* 添加 className */}
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
          <span>{t('recentEventsPage.sections.careerAndEducation.jobChangeLabel')}</span> {/* 使用 span 包裹文本 */}
        </label>
        <label className="checkbox-label"> {/* 添加 className */}
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
          <span>{t('recentEventsPage.sections.careerAndEducation.promotionLabel')}</span> {/* 使用 span 包裹文本 */}
        </label>
        <label className="checkbox-label"> {/* 添加 className */}
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
          <span>{t('recentEventsPage.sections.careerAndEducation.studyChangeLabel')}</span> {/* 使用 span 包裹文本 */}
        </label>
      </div>

      <div className="form-section">
        <h3>{t('recentEventsPage.sections.relationships.title')}</h3>
        <label className="checkbox-label"> {/* 添加 className */}
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
          <span>{t('recentEventsPage.sections.relationships.marriageLabel')}</span> {/* 使用 span 包裹文本 */}
        </label>
        <label className="checkbox-label"> {/* 添加 className */}
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
          <span>{t('recentEventsPage.sections.relationships.newBabyLabel')}</span> {/* 使用 span 包裹文本 */}
        </label>
        <label className="checkbox-label"> {/* 添加 className */}
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
          <span>{t('recentEventsPage.sections.relationships.relationshipChangeLabel')}</span> {/* 使用 span 包裹文本 */}
        </label>
        <label className="checkbox-label"> {/* 添加 className */}
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
          <span>{t('recentEventsPage.sections.relationships.bereavementLabel')}</span> {/* 使用 span 包裹文本 */}
        </label>
      </div>

      <div className="form-section">
        <h3>{t('recentEventsPage.sections.health.title')}</h3>
        <label className="checkbox-label"> {/* 添加 className */}
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
          <span>{t('recentEventsPage.sections.health.healthIssueLabel')}</span> {/* 使用 span 包裹文本 */}
        </label>
      </div>

      <div className="form-section">
        <h3>{t('recentEventsPage.sections.finance.title')}</h3>
        <label className="checkbox-label"> {/* 添加 className */}
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
          <span>{t('recentEventsPage.sections.finance.financialChangeLabel')}</span> {/* 使用 span 包裹文本 */}
        </label>
      </div>

      <div className="form-section">
        <h3>{t('recentEventsPage.sections.other.title')}</h3>
        <textarea
          placeholder={t('recentEventsPage.sections.other.placeholder')}
          value={recentEvents.other}
          onChange={(e) =>
            setRecentEvents((prev) => ({ ...prev, other: e.target.value }))
          }
        />
      </div>

      <button onClick={saveRecentEvents} disabled={isSaving}>
        {isSaving ? t('recentEventsPage.savingButton') : t('recentEventsPage.saveButton')}
      </button>
    </div>
  );
};

export default RecentEventsPage;
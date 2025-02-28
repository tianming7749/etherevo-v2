// RecentEventsPage.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import { generatePromptsForUser } from "../../../utils/generatePrompts";
import { useUserContext } from "../../../context/UserContext";
import "./RecentEventsPage.css";
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom'; // 导入 useNavigate

const RecentEventsPage: React.FC = () => {
  const { userId } = useUserContext(); // 仅使用 userId，不使用 loading，因为我们自定义 isLoading
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
  const [isLoading, setIsLoading] = useState(true); // 用于初始加载
  const [isSaving, setIsSaving] = useState(false); // 用于保存时的加载状态
  const [error, setError] = useState<string | null>(null); // 添加错误状态
  const [saveStatus, setSaveStatus] = useState<string>(''); // 保存状态反馈
  const { t } = useTranslation();
  const navigate = useNavigate(); // 使用 useNavigate 钩子

  useEffect(() => {
    const fetchRecentEvents = async () => {
      if (!userId) {
        setIsLoading(false); // 如果没有 userId，直接结束加载状态
        setError(t('recentEventsPage.noLoginMessage', 'Please log in to set your recent events.'));
        return;
      }

      setIsLoading(true); // 开始加载时设置 isLoading 为 true
      setError(null); // 重置错误状态
      try {
        const { data, error } = await supabase
          .from("user_recent_events")
          .select("recent_events")
          .eq("user_id", userId)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            console.log("No recent events found, initializing with defaults.");
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
          } else {
            console.error("Error fetching recent events:", error);
            setError(t('recentEventsPage.fetchError', 'Failed to load recent events. Please try again later.'));
          }
        } else if (data) {
          setRecentEvents(data.recent_events || {
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
      } catch (err) {
        console.error("Error loading recent events:", err);
        setError(t('recentEventsPage.fetchError', 'Failed to load recent events. Please try again later.'));
      } finally {
        setIsLoading(false); // 加载完成，设置 isLoading 为 false
      }
    };

    fetchRecentEvents();
  }, [userId, t]); // 依赖项优化为 userId 和 t，确保仅在必要时触发

  const saveRecentEvents = async () => {
    if (!userId) {
      alert(t('recentEventsPage.noLoginMessage', 'Please log in to set your recent events.'));
      return;
    }

    setIsSaving(true); // 开始保存时设置 isSaving
    setSaveStatus(t('recentEventsPage.savingButton', 'Saving...')); // 显示“Saving...”

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
        setSaveStatus(t('recentEventsPage.saveErrorAlert')); // 显示保存失败提示
        setTimeout(() => setSaveStatus(''), 2000); // 2秒后清空
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
        setSaveStatus(t('recentEventsPage.saveNetworkErrorAlert')); // 显示网络错误提示
        setTimeout(() => setSaveStatus(''), 2000); // 2秒后清空
      } else {
        console.log("提示词已成功保存");
        setSaveStatus(t('recentEventsPage.saveSuccessAlert')); // 显示“Saved!”
        setTimeout(() => {
          setSaveStatus(''); // 2秒后恢复为“Save”
          navigate('/chat'); // 保存成功后跳转到 Chat 页面
        }, 2000);
      }
    } catch (error) {
      console.error("保存过程中发生错误：", error);
      setSaveStatus(t('recentEventsPage.saveNetworkErrorAlert')); // 显示网络错误提示
      setTimeout(() => setSaveStatus(''), 2000); // 2秒后清空
    } finally {
      setIsSaving(false); // 保存完成（无论成功或失败）重置 isSaving
    }
  };

  const handleSkip = () => {
    // 跳过当前页面，直接导航到下一个页面（Chat）
    if (!userId) {
      alert(t('recentEventsPage.noLoginMessage', 'Please log in to set your recent events.'));
      return;
    }
    navigate('/chat'); // 直接跳转，无反馈
  };

  if (isLoading) {
    return <div className="loading-message">{t('recentEventsPage.loadingMessage', 'Loading...')}</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="recent-events-page">
      <div className="form-section">
        <h3>{t('recentEventsPage.sections.moving.title')}</h3>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={recentEvents.moving}
            onChange={(e) =>
              setRecentEvents((prev) => ({ ...prev, moving: e.target.checked }))
            }
            disabled={isSaving} // 使用 isSaving 禁用输入框
          />
          <span>{t('recentEventsPage.sections.moving.label')}</span>
        </label>
      </div>

      <div className="form-section">
        <h3>{t('recentEventsPage.sections.careerAndEducation.title')}</h3>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={recentEvents.jobChange}
            onChange={(e) =>
              setRecentEvents((prev) => ({
                ...prev,
                jobChange: e.target.checked,
              }))
            }
            disabled={isSaving} // 使用 isSaving 禁用输入框
          />
          <span>{t('recentEventsPage.sections.careerAndEducation.jobChangeLabel')}</span>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={recentEvents.promotion}
            onChange={(e) =>
              setRecentEvents((prev) => ({
                ...prev,
                promotion: e.target.checked,
              }))
            }
            disabled={isSaving} // 使用 isSaving 禁用输入框
          />
          <span>{t('recentEventsPage.sections.careerAndEducation.promotionLabel')}</span>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={recentEvents.studyChange}
            onChange={(e) =>
              setRecentEvents((prev) => ({
                ...prev,
                studyChange: e.target.checked,
              }))
            }
            disabled={isSaving} // 使用 isSaving 禁用输入框
          />
          <span>{t('recentEventsPage.sections.careerAndEducation.studyChangeLabel')}</span>
        </label>
      </div>

      <div className="form-section">
        <h3>{t('recentEventsPage.sections.relationships.title')}</h3>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={recentEvents.marriage}
            onChange={(e) =>
              setRecentEvents((prev) => ({
                ...prev,
                marriage: e.target.checked,
              }))
            }
            disabled={isSaving} // 使用 isSaving 禁用输入框
          />
          <span>{t('recentEventsPage.sections.relationships.marriageLabel')}</span>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={recentEvents.newBaby}
            onChange={(e) =>
              setRecentEvents((prev) => ({
                ...prev,
                newBaby: e.target.checked,
              }))
            }
            disabled={isSaving} // 使用 isSaving 禁用输入框
          />
          <span>{t('recentEventsPage.sections.relationships.newBabyLabel')}</span>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={recentEvents.relationshipChange}
            onChange={(e) =>
              setRecentEvents((prev) => ({
                ...prev,
                relationshipChange: e.target.checked,
              }))
            }
            disabled={isSaving} // 使用 isSaving 禁用输入框
          />
          <span>{t('recentEventsPage.sections.relationships.relationshipChangeLabel')}</span>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={recentEvents.bereavement}
            onChange={(e) =>
              setRecentEvents((prev) => ({
                ...prev,
                bereavement: e.target.checked,
              }))
            }
            disabled={isSaving} // 使用 isSaving 禁用输入框
          />
          <span>{t('recentEventsPage.sections.relationships.bereavementLabel')}</span>
        </label>
      </div>

      <div className="form-section">
        <h3>{t('recentEventsPage.sections.health.title')}</h3>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={recentEvents.healthIssue}
            onChange={(e) =>
              setRecentEvents((prev) => ({
                ...prev,
                healthIssue: e.target.checked,
              }))
            }
            disabled={isSaving} // 使用 isSaving 禁用输入框
          />
          <span>{t('recentEventsPage.sections.health.healthIssueLabel')}</span>
        </label>
      </div>

      <div className="form-section">
        <h3>{t('recentEventsPage.sections.finance.title')}</h3>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={recentEvents.financialChange}
            onChange={(e) =>
              setRecentEvents((prev) => ({
                ...prev,
                financialChange: e.target.checked,
              }))
            }
            disabled={isSaving} // 使用 isSaving 禁用输入框
          />
          <span>{t('recentEventsPage.sections.finance.financialChangeLabel')}</span>
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
          disabled={isSaving} // 使用 isSaving 禁用输入框
        />
      </div>

      <div className="buttons-container"> {/* 添加容器以并排放置按钮 */}
        <button onClick={handleSkip} disabled={isSaving}>
          {t('recentEventsPage.skipButton', 'Skip')} {/* 保持原始文本，无状态反馈 */}
        </button>
        <button onClick={saveRecentEvents} disabled={isSaving}>
          {saveStatus || (isSaving ? t('recentEventsPage.savingButton', 'Saving...') : t('recentEventsPage.saveButton', 'Save'))} {/* 动态显示保存状态 */}
        </button>
      </div>
    </div>
  );
};

export default RecentEventsPage;
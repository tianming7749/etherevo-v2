// Settings.tsx
import React from 'react';
import { Routes, Route, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TonesPage from '../pages/Tones/TonesPage'; // 确保路径正确
import GoalsPage from '../pages/Goals/GoalsPage'; // 确保路径正确
import UserInfo from '../pages/UserInfo/UserInfo'; // 确保路径正确
import BasicInfo from '../pages/UserInfo/BasicInfo/BasicInfo'; // 确保路径正确
import LifeEnvironment from '../pages/UserInfo/LifeEnvironment/LifeEnvironment'; // 确保路径正确
import HealthConditionPage from '../pages/UserInfo/HealthCondition/HealthConditionPage'; // 确保路径正确
import InterestsPage from '../pages/UserInfo/Interests/InterestsPage'; // 确保路径正确
import RecentEventsPage from '../pages/UserInfo/RecentEvents/RecentEventsPage'; // 确保路径正确
import SocialSupportPage from '../pages/UserInfo/SocialSupport/SocialSupportPage'; // 确保路径正确
import './Settings.css'; // 确保路径正确

const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  console.log("Settings component rendered, language:", i18n.language); // 调试日志

  try {
    return (
      <div className="settings-container">
        {/* 头部标题和返回按钮 */}
        <div className="settings-header">
          <h1 className="settings-title">{t('settings.title')}</h1>
          <button 
            className="back-button" 
            onClick={() => navigate(-1)} 
            aria-label={t('settings.back')}
          >
            ←
          </button>
        </div>
        <div className="settings-content">
          <Routes>
            <Route path="tones" element={<TonesPage />} />
            <Route path="goals" element={<GoalsPage />} />
            <Route path="user-info" element={<UserInfo />}>
              <Route index element={<BasicInfo />} />
              <Route path="basic-info" element={<BasicInfo />} />
              <Route path="environment" element={<LifeEnvironment />} />
              <Route path="health-condition" element={<HealthConditionPage />} />
              <Route path="interests" element={<InterestsPage />} />
              <Route path="recent-events" element={<RecentEventsPage />} />
              <Route path="social-support" element={<SocialSupportPage />} />
            </Route>
            <Route path="/" element={<TonesPage />} /> {/* 默认显示 Tones 页面 */}
          </Routes>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error rendering Settings component:", error);
    return <div>{t('settings.errorLoading')}</div>; // 使用翻译的错误提示
  }
};

export default Settings;
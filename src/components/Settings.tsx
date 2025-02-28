// Settings.tsx
import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom'; // 移除 NavLink，因为不再需要导航
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

  console.log("Settings component rendered, language:", i18n.language); // 调试日志

  try {
    return (
      <div className="settings-container">
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
    return <div>Error loading Settings. Please check the console for details.</div>; // 临时错误提示
  }
};

export default Settings;
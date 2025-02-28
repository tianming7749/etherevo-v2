// src/pages/UserInfo/UserInfo.tsx
import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import "./UserInfo.css";
import { useTranslation } from 'react-i18next';

const UserInfo: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation(); // 获取当前路径
  const [selectedOption, setSelectedOption] = useState<string>(location.pathname.split('/').pop() || 'basic-info'); // 默认选中当前路由

  // 更新 selectedOption 当路由变化时
  useEffect(() => {
    const currentPath = location.pathname.split('/').pop() || 'basic-info';
    setSelectedOption(currentPath);
  }, [location.pathname]);

  const navOptions = [
    { path: "basic-info", label: t('userInfoPage.nav.basicInfo') },
    { path: "environment", label: t('userInfoPage.nav.environment') },
    { path: "health-condition", label: t('userInfoPage.nav.healthCondition') },
    { path: "interests", label: t('userInfoPage.nav.interests') },
    { path: "social-support", label: t('userInfoPage.nav.socialSupport') },
    { path: "recent-events", label: t('userInfoPage.nav.recentEvents') },
  ];

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const path = event.target.value;
    setSelectedOption(path);
    // 使用 NavLink 导航到选中的路由
    // 注意：确保路径以 /settings/user-info/ 开头
    window.location.href = `/settings/user-info/${path}`; // 或者使用 navigate('/settings/user-info/' + path)
  };

  return (
    <div className="user-info-container">
      <h1>{t('userInfoPage.title')}</h1>
      <nav className="user-info-nav">
        <select
          value={selectedOption}
          onChange={handleSelectChange}
          className={`nav-dropdown ${selectedOption === location.pathname.split('/').pop() ? 'nav-link-active' : ''}`}
        >
          {navOptions.map((option) => (
            <option key={option.path} value={option.path}>
              {option.label}
            </option>
          ))}
        </select>
      </nav>
      <Outlet />
    </div>
  );
};

export default UserInfo;
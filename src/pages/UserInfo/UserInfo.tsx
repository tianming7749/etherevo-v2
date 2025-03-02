// src/pages/UserInfo/UserInfo.tsx
import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"; // 添加 useNavigate
import "./UserInfo.css";
import { useTranslation } from 'react-i18next';

const UserInfo: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation(); // 获取当前路径
  const navigate = useNavigate(); // 添加 navigate 钩子
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

  const handleNavClick = (path: string) => {
    setSelectedOption(path);
    navigate(`/settings/user-info/${path}`); // 使用 navigate 进行路由跳转
  };

  return (
    <div className="user-info-container" role="main" aria-label={t('userInfoPage.pageTitle')}>
      <h1 className="user-info-title">{t('userInfoPage.title')}</h1>
      <nav className="user-info-nav" role="tablist" aria-label={t('userInfoPage.navLabel')}>
        {navOptions.map((option) => (
          <NavLink
            key={option.path}
            to={`/settings/user-info/${option.path}`}
            onClick={() => handleNavClick(option.path)}
            className={`nav-tab ${selectedOption === option.path ? 'nav-tab-active' : ''}`}
            role="tab"
            aria-selected={selectedOption === option.path}
            aria-controls={`panel-${option.path}`}
          >
            {option.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
};

export default UserInfo;
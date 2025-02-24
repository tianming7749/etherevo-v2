// src/pages/UserInfo/UserInfo.tsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "./UserInfo.css";
import { useTranslation } from 'react-i18next';

const UserInfo: React.FC = () => {
  const { t } = useTranslation();

  const checkActive = (isActive: boolean, path: string) => {
    const isCurrentPath = window.location.pathname.includes(path);
    return isCurrentPath || isActive ? "nav-link nav-link-active" : "nav-link";
  };

  return (
    <div className="user-info-container">
      <h1>{t('userInfoPage.title')}</h1>
      <nav className="user-info-nav">
        <ul className="user-info-nav-list">
          <li>
            <NavLink 
              to="basic-info" 
              className={({ isActive }) => checkActive(isActive, 'basic-info')}
            >
              {t('userInfoPage.nav.basicInfo')}
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="environment" 
              className={({ isActive }) => checkActive(isActive, 'environment')}
            >
              {t('userInfoPage.nav.environment')}
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="health-condition" 
              className={({ isActive }) => checkActive(isActive, 'health-condition')}
            >
              {t('userInfoPage.nav.healthCondition')}
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="interests" 
              className={({ isActive }) => checkActive(isActive, 'interests')}
            >
              {t('userInfoPage.nav.interests')}
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="social-support" 
              className={({ isActive }) => checkActive(isActive, 'social-support')}
            >
              {t('userInfoPage.nav.socialSupport')}
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="recent-events" 
              className={({ isActive }) => checkActive(isActive, 'recent-events')}
            >
              {t('userInfoPage.nav.recentEvents')}
            </NavLink>
          </li>
        </ul>
      </nav>
      <Outlet />
    </div>
  );
};

export default UserInfo;
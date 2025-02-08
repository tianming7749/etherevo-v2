// src/pages/UserInfo/UserInfo.tsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "./UserInfo.css";

const UserInfo: React.FC = () => {
  const checkActive = (isActive: boolean, path: string) => {
    const isCurrentPath = window.location.pathname.includes(path);
    return isCurrentPath || isActive ? "nav-link nav-link-active" : "nav-link";
  };

  return (
    <div className="user-info-container">
      <h1>用户信息</h1>
      <nav className="user-info-nav">
        <ul className="user-info-nav-list">
          <li>
            <NavLink 
              to="basic-info" 
              className={({ isActive }) => checkActive(isActive, 'basic-info')}
            >
              基本信息
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="environment" 
              className={({ isActive }) => checkActive(isActive, 'environment')}
            >
              生活环境和压力源
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="health-condition" 
              className={({ isActive }) => checkActive(isActive, 'health-condition')}
            >
              健康状况
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="interests" 
              className={({ isActive }) => checkActive(isActive, 'interests')}
            >
              兴趣与爱好
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="social-support" 
              className={({ isActive }) => checkActive(isActive, 'social-support')}
            >
              社交支持系统
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="habits-lifestyle" 
              className={({ isActive }) => checkActive(isActive, 'habits-lifestyle')}
            >
              日常习惯和生活方式
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="recent-events" 
              className={({ isActive }) => checkActive(isActive, 'recent-events')}
            >
              近期的重大生活事件
            </NavLink>
          </li>
        </ul>
      </nav>
      <Outlet />
    </div>
  );
};

export default UserInfo;
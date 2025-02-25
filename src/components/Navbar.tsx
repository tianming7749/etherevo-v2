// Navbar.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";
import { supabase } from "../supabaseClient";
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { useUserContext } from "../context/UserContext"; // 导入 UserContext

interface NavbarProps {
  activeButton: string;
  onButtonClick: (buttonId: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeButton, onButtonClick }) => {
  const { t } = useTranslation();
  const { userName, loading } = useUserContext(); // 获取用户名称和加载状态

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      onButtonClick('Auth');
    } else {
      console.error("Logout failed:", error.message);
    }
  };

  if (loading) return null; // 加载中时不渲染

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h2 className="etherevo-title">{t('navbar.title')}</h2>
      </div>
      <div className="navbar-right">
        {userName && (
          <span className="user-name">
            {userName}
          </span>
        )}
        <NavLink
          to="/chat"
          end
          onClick={() => onButtonClick('Chat')}
          className="navbar-link"
        >
          {t('navbar.chat')}
        </NavLink>
        <NavLink
          to="/settings"
          end
          onClick={() => onButtonClick('Settings')}
          className="navbar-link"
        >
          {t('navbar.settings')}
        </NavLink>
        <select
          value={i18n.language}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
          className="language-selector"
        >
          <option value="zh">中文</option>
          <option value="en">English</option>
        </select>
        <button
          onClick={handleLogout}
          className="logout-button"
        >
          {t('navbar.logout')}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
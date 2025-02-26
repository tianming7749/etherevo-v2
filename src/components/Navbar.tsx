// Navbar.tsx
import React, { useState, useEffect } from "react";
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
  const { userId, loading } = useUserContext(); // 获取 userId 和加载状态
  const [userName, setUserName] = useState<string | null>(null); // 存储用户的 name

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      onButtonClick('Auth');
    } else {
      console.error("Logout failed:", error.message);
    }
  };

  // 加载用户名称
  useEffect(() => {
    const fetchUserName = async () => {
      if (!userId || loading) return;

      const { data, error } = await supabase
        .from("user_basic_info")
        .select("name")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error fetching user name:", error);
        setUserName(null); // 如果查询失败，显示为空
      } else {
        setUserName(data?.name || null); // 设置查询到的 name 或 null
      }
    };

    fetchUserName();
  }, [userId, loading]);

  if (loading) return null; // 加载中时不渲染

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h2 className="etherevo-title">{t('navbar.title')}</h2>
      </div>
      <div className="navbar-right">
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
        {userName && ( // 仅在有用户名称时显示
          <span className="user-name">{userName}</span>
        )}
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
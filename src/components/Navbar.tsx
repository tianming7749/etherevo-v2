// Navbar.tsx
import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import "./Navbar.css";
import { supabase } from "../supabaseClient";
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { useUserContext } from "../context/UserContext";

interface NavbarProps {
  activeButton: string;
  onButtonClick: (buttonId: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeButton, onButtonClick }) => {
  const { t, ready } = useTranslation('translation'); // 添加 ready 检查
  const { userId, loading } = useUserContext();
  const [userName, setUserName] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [language, setLanguage] = useState<string>(i18n.language || 'en');
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('i18nextLng');
    if (savedLanguage && ['en', 'zh'].includes(savedLanguage)) {
      i18n.changeLanguage(savedLanguage).then(() => {
        setLanguage(savedLanguage);
      });
    }
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      onButtonClick('Auth');
    } else {
      console.error("Logout failed:", error.message);
    }
  };

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
        setUserName(null);
      } else {
        setUserName(data?.name || null);
      }
    };
    fetchUserName();
  }, [userId, loading]);

  useEffect(() => {
    setLanguage(i18n.language || 'en');
  }, [i18n.language]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (loading || !ready) return <div>加载中...</div>; // 加载中或翻译未就绪时显示占位符

  const handleDropdownItemClick = (path: string) => {
    setIsDropdownOpen(false);
    onButtonClick('Settings');
  };

  const isActiveRoute = (path: string) => location.pathname === path;

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value;
    setLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('i18nextLng', newLanguage);
  };

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
          className={`navbar-link ${activeButton === 'Chat' ? 'active' : ''}`}
        >
          {t('navbar.chat')}
        </NavLink>
        <div className="dropdown-container" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`navbar-link dropdown-button ${activeButton === 'Settings' ? 'active' : ''}`}
          >
            {t('navbar.settings')}
          </button>
          {isDropdownOpen && (
            <div className="dropdown-menu">
              <NavLink
                to="/settings/tones"
                className={`dropdown-item ${isActiveRoute('/settings/tones') ? 'active' : ''}`}
                onClick={() => handleDropdownItemClick('/settings/tones')}
              >
                {isActiveRoute('/settings/tones') ? '✓ ' : '  '}{t('settings.tones')}
              </NavLink>
              <NavLink
                to="/settings/goals"
                className={`dropdown-item ${isActiveRoute('/settings/goals') ? 'active' : ''}`}
                onClick={() => handleDropdownItemClick('/settings/goals')}
              >
                {isActiveRoute('/settings/goals') ? '✓ ' : '  '}{t('settings.goals')}
              </NavLink>
              <NavLink
                to="/settings/user-info"
                className={`dropdown-item ${isActiveRoute('/settings/user-info') ? 'active' : ''}`}
                onClick={() => handleDropdownItemClick('/settings/user-info')}
              >
                {isActiveRoute('/settings/user-info') ? '✓ ' : '  '}{t('settings.userInfo')}
              </NavLink>
            </div>
          )}
        </div>
        <select
          value={language}
          onChange={handleLanguageChange}
          className="language-selector"
        >
          <option value="en">English</option>
          <option value="zh">中文</option>
        </select>
        {userName && <span className="user-name">{userName}</span>}
        <button onClick={handleLogout} className="logout-button">
          {t('navbar.logout')}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
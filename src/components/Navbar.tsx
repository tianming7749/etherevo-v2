// Navbar.tsx
import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
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
  const { t, ready } = useTranslation('translation');
  const { userId, loading: contextLoading } = useUserContext();
  const [userName, setUserName] = useState<string | null>(null);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [language, setLanguage] = useState<string>(i18n.language || 'en');
  const [isNameLoading, setIsNameLoading] = useState(true); // 单独跟踪 userName 的加载状态
  const location = useLocation();
  const navigate = useNavigate();
  const settingsDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('i18nextLng');
    if (savedLanguage && ['en', 'zh'].includes(savedLanguage)) {
      i18n.changeLanguage(savedLanguage).then(() => {
        setLanguage(savedLanguage);
      });
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchUserName = async () => {
      if (!userId || contextLoading) {
        if (mounted) setIsNameLoading(true); // 确保加载状态为 true
        return;
      }
      setIsNameLoading(true); // 开始加载用户名称
      try {
        const { data, error } = await supabase
          .from("user_basic_info")
          .select("name")
          .eq("user_id", userId)
          .single();
        if (mounted) {
          if (error) {
            console.error("Error fetching user name:", error);
            setUserName(null);
          } else {
            setUserName(data?.name || null);
          }
          setIsNameLoading(false); // 加载完成
        }
      } catch (err) {
        console.error("Unexpected error fetching user name:", err);
        if (mounted) {
          setUserName(null);
          setIsNameLoading(false); // 加载失败也标记为完成
        }
      }
    };
    fetchUserName();
    return () => {
      mounted = false; // 防止内存泄漏
    };
  }, [userId, contextLoading]);

  useEffect(() => {
    setLanguage(i18n.language || 'en');
  }, [i18n.language]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target as Node)) {
        setIsSettingsDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 只有当上下文加载和翻译就绪时才渲染导航栏，否则显示加载占位符
  if (contextLoading || !ready || isNameLoading) {
    return (
      <nav className="navbar loading">
        <div className="navbar-left">
          <h2 className="etherevo-title">{t('navbar.title')}</h2>
        </div>
        <div className="navbar-right">
          <span className="loading-placeholder">{t('navbar.loading')}</span>
        </div>
      </nav>
    );
  }

  const handleDropdownItemClick = (path: string) => {
    setIsSettingsDropdownOpen(false);
    onButtonClick('Settings');
  };

  const isActiveRoute = (path: string) => location.pathname === path;

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('i18nextLng', newLanguage);
    setIsUserDropdownOpen(false); // 选择语言后关闭下拉菜单
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      navigate('/'); // 假设登出后返回首页
    } else {
      console.error("Logout failed:", error.message);
    }
    setIsUserDropdownOpen(false); // 登出后关闭下拉菜单
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
          aria-label={t('navbar.chat')}
        >
          {t('navbar.chat')}
        </NavLink>
        <button
          className="hamburger-menu"
          onClick={() => setIsSettingsDropdownOpen(!isSettingsDropdownOpen)}
          aria-label={t('navbar.settings')}
        >
          ☰
        </button>
        {isSettingsDropdownOpen && (
          <div className="dropdown-menu" ref={settingsDropdownRef}>
            <NavLink
              to="/settings/tones"
              className={`dropdown-item ${isActiveRoute('/settings/tones') ? 'active' : ''}`}
              onClick={() => handleDropdownItemClick('/settings/tones')}
              aria-label={t('settings.tones')}
            >
              {isActiveRoute('/settings/tones') ? '✓ ' : '  '}{t('settings.tones')}
            </NavLink>
            <NavLink
              to="/settings/goals"
              className={`dropdown-item ${isActiveRoute('/settings/goals') ? 'active' : ''}`}
              onClick={() => handleDropdownItemClick('/settings/goals')}
              aria-label={t('settings.goals')}
            >
              {isActiveRoute('/settings/goals') ? '✓ ' : '  '}{t('settings.goals')}
            </NavLink>
            <NavLink
              to="/settings/user-info"
              className={`dropdown-item ${isActiveRoute('/settings/user-info') ? 'active' : ''}`}
              onClick={() => handleDropdownItemClick('/settings/user-info')}
              aria-label={t('settings.userInfo')}
            >
              {isActiveRoute('/settings/user-info') ? '✓ ' : '  '}{t('settings.userInfo')}
            </NavLink>
          </div>
        )}
        <button
          className="user-button"
          onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
          aria-label={t('navbar.userMenu')}
        >
          {userName || t('navbar.userPlaceholder')}
        </button>
        {isUserDropdownOpen && (
          <div className="user-dropdown-menu" ref={userDropdownRef}>
            <div className="dropdown-item" onClick={() => handleLanguageChange('en')}>
              English
            </div>
            <div className="dropdown-item" onClick={() => handleLanguageChange('zh')}>
              中文
            </div>
            <div className="dropdown-item logout-button" onClick={handleLogout}>
              {t('navbar.logout')}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
// Navbar.tsx
import React, { useState, useEffect, useRef } from "react"; // 导入 useRef
import { NavLink, useLocation } from "react-router-dom"; // 导入 useLocation
import "./Navbar.css";
import { supabase } from "../supabaseClient";
import { useTranslation } from 'react-i18next';
import i18n from '../i18n'; // 导入 i18n，以便直接使用 changeLanguage
import { useUserContext } from "../context/UserContext"; // 导入 UserContext

interface NavbarProps {
  activeButton: string;
  onButtonClick: (buttonId: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeButton, onButtonClick }) => {
  const { t } = useTranslation();
  const { userId, loading } = useUserContext(); // 获取 userId 和加载状态
  const [userName, setUserName] = useState<string | null>(null); // 存储用户的 name
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // 控制下拉菜单的显示/隐藏
  const [language, setLanguage] = useState<string>(i18n.language || 'en'); // 默认使用 i18n.language 或回退到 'en'
  const location = useLocation(); // 获取当前路径，用于判断激活状态
  const dropdownRef = useRef<HTMLDivElement>(null); // 创建 ref 用于跟踪下拉菜单的 DOM 元素

  // 在组件挂载时恢复语言选择
  useEffect(() => {
    const savedLanguage = localStorage.getItem('i18nextLng');
    if (savedLanguage && ['en', 'zh'].includes(savedLanguage)) {
      i18n.changeLanguage(savedLanguage).then(() => {
        setLanguage(savedLanguage);
      });
    }
  }, []); // 仅在组件挂载时运行

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

  // 同步语言状态，确保与 i18n.language 一致
  useEffect(() => {
    setLanguage(i18n.language || 'en'); // 同步 i18n.language，确保初始值为当前语言或回退到 'en'
  }, [i18n.language]);

  // 添加全局点击事件监听器，点击页面其他位置关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false); // 如果点击在下拉菜单外部，关闭菜单
      }
    };

    // 绑定全局点击事件
    document.addEventListener("mousedown", handleClickOutside);

    // 组件卸载时移除事件监听器
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]); // 依赖项中添加 dropdownRef，确保事件监听器正确工作

  if (loading) return null; // 加载中时不渲染

  // 处理下拉菜单点击，关闭菜单并触发 onButtonClick
  const handleDropdownItemClick = (path: string) => {
    setIsDropdownOpen(false);
    onButtonClick('Settings'); // 保持 Settings 作为 activeButton
  };

  // 判断当前路径是否匹配下拉菜单项
  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  // 语言切换处理
  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value;
    setLanguage(newLanguage);
    i18n.changeLanguage(newLanguage); // 切换语言
    localStorage.setItem('i18nextLng', newLanguage); // 持久化到 localStorage
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
        <div className="dropdown-container" ref={dropdownRef}> {/* 添加 ref */}
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
                {isActiveRoute('/settings/tones') ? '✓ ' : '  '}{t('settings.tones', 'Tones')}
              </NavLink>
              <NavLink
                to="/settings/goals"
                className={`dropdown-item ${isActiveRoute('/settings/goals') ? 'active' : ''}`}
                onClick={() => handleDropdownItemClick('/settings/goals')}
              >
                {isActiveRoute('/settings/goals') ? '✓ ' : '  '}{t('settings.goals', 'Goals')}
              </NavLink>
              <NavLink
                to="/settings/user-info"
                className={`dropdown-item ${isActiveRoute('/settings/user-info') ? 'active' : ''}`}
                onClick={() => handleDropdownItemClick('/settings/user-info')}
              >
                {isActiveRoute('/settings/user-info') ? '✓ ' : '  '}{t('settings.userInfo', 'User Info')}
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
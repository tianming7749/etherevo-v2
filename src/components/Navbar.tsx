import React from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";
import { supabase } from "../supabaseClient";
import { useTranslation } from 'react-i18next';
import i18n from '../i18n'; //  ✅ 导入 i18n 实例


interface NavbarProps {
  activeButton: string;
  onButtonClick: (buttonId: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeButton, onButtonClick }) => {
  const { t } = useTranslation(); //  获取 t 函数

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      // 假设这里的父组件负责导航至"/auth"
      onButtonClick('Auth'); // 通知父组件更新状态为Auth
    } else {
      console.error("Logout failed:", error.message);
    }
  };

  return (
    <nav
      className="navbar" //  ✅  使用 className="navbar"，  样式定义在 Navbar.css 中
    >
      <div>
        <h2 style={{ color: '#FFD700' }} className="etherevo-title">{t('navbar.title')}</h2>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        <NavLink
          to="/"
          end
          onClick={() => onButtonClick('Welcome')}
          className="navbar-link" //  ✅  使用 className="navbar-link"，  样式定义在 Navbar.css 中
        >
          {t('navbar.welcome')}
        </NavLink>
        <NavLink
          to="/tones"
          end
          onClick={() => onButtonClick('Tones')}
          className="navbar-link" //  ✅  使用 className="navbar-link"，  样式定义在 Navbar.css 中
        >
          {t('navbar.tones')}
        </NavLink>
        <NavLink
          to="/goals"
          end
          onClick={() => onButtonClick('Goals')}
          className="navbar-link" //  ✅  使用 className="navbar-link"，  样式定义在 Navbar.css 中
        >
          {t('navbar.goals')}
        </NavLink>
        <NavLink
          to="/user-info"
          end
          onClick={() => onButtonClick('UserInfo')}
          className="navbar-link" //  ✅  使用 className="navbar-link"，  样式定义在 Navbar.css 中
        >
          {t('navbar.userInfo')}
        </NavLink>
        <NavLink
          to="/chat"
          end
          onClick={() => onButtonClick('Chat')}
          className="navbar-link" //  ✅  使用 className="navbar-link"，  样式定义在 Navbar.css 中
        >
          {t('navbar.chat')}
        </NavLink>

        {/*  ✅  语言选择器 (下拉菜单)  */}
        <select
          value={i18n.language}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
          style={{
            backgroundColor: "#f0f0f0",
            color: "#333",
            border: "none",
            borderRadius: "5px",
            padding: "5px 10px",
            cursor: "pointer",
            marginLeft: "15px",
          }}
        >
          <option value="zh-CN">中文</option>
          <option value="en-US">English</option>
        </select>

        {/* Logout 按钮 */}
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: "#ff4d4d",
            color: "white",
            border: "none",
            borderRadius: "5px",
            padding: "5px 10px",
            cursor: "pointer",
            marginLeft: "15px",
          }}
        >
          {t('navbar.logout')}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
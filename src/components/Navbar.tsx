import React from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";
import { supabase } from "../supabaseClient";

interface NavbarProps {
  activeButton: string;
  onButtonClick: (buttonId: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeButton, onButtonClick }) => {
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
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#4682B4",
        padding: "10px 20px",
        borderRadius: "8px",
        color: "white",
        width: "96vw",
      }}
    >
      <div>
        <h2 style={{ color: '#FFD700' }} className="etherevo-title">EtherEvo</h2>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        <NavLink
          to="/"
          end
          onClick={() => onButtonClick('Welcome')}
          style={({ isActive }) => ({
            textDecoration: "none",
            color: activeButton === 'Welcome' ? "#FFD700" : "white",
          })}
        >
          Welcome
        </NavLink>
        <NavLink
          to="/tones"
          end
          onClick={() => onButtonClick('Tones')}
          style={({ isActive }) => ({
            textDecoration: "none",
            color: activeButton === 'Tones' ? "#FFD700" : "white",
          })}
        >
          Tones
        </NavLink>
        <NavLink
          to="/goals"
          end
          onClick={() => onButtonClick('Goals')}
          style={({ isActive }) => ({
            textDecoration: "none",
            color: activeButton === 'Goals' ? "#FFD700" : "white",
          })}
        >
          Goals
        </NavLink>
        <NavLink
          to="/user-info"
          end
          onClick={() => onButtonClick('UserInfo')}
          style={({ isActive }) => ({
            textDecoration: "none",
            color: activeButton === 'UserInfo' ? "#FFD700" : "white",
          })}
        >
          UserInfo
        </NavLink>
        <NavLink
          to="/chat"
          end
          onClick={() => onButtonClick('Chat')}
          style={({ isActive }) => ({
            textDecoration: "none",
            color: activeButton === 'Chat' ? "#FFD700" : "white",
          })}
        >
          Chat
        </NavLink>
        
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
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
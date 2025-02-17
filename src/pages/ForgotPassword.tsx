import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "./Auth.css"; // 假设您的 Auth.css 文件也适用于 ForgotPassword 页面，或者您可以创建单独的 CSS

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handlePasswordReset = async () => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      setMessage("Error sending reset email. Please try again.");
    } else {
      setMessage("Password reset email sent. Please check your email.");
      // 可以设定一个定时器，过一段时间后跳转回登录页面 (保留原有的定时跳转逻辑)
      setTimeout(() => navigate("/auth"), 5000); // 5秒后返回到认证页面
    }
  };

  const handleBackToLogin = () => { // 新增返回登录页面的处理函数
    navigate("/auth");
  };

  return (
    <div className="auth-container">
      <h2>Reset Your Password</h2>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="auth-input"
      />
      <button onClick={handlePasswordReset} className="auth-button">
        Reset Password
      </button>
      {message && <p className="auth-message">{message}</p>}
      <button onClick={handleBackToLogin} className="auth-button auth-back-button"> {/* 新增返回登录按钮 */}
        Back to Login
      </button>
    </div>
  );
};

export default ForgotPassword;
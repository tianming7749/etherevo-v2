import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next'; // 导入 useTranslation
import "./Auth.css"; // 使用现有的 Auth.css

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation(); // 获取 t 函数

  const handlePasswordReset = async () => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      setMessage(t('forgotPassword.messages.error'));
    } else {
      setMessage(t('forgotPassword.messages.success'));
      setTimeout(() => navigate("/auth"), 5000); // 5秒后返回到认证页面
    }
  };

  const handleBackToLogin = () => {
    navigate("/auth");
  };

  return (
    <div className="auth-container">
      <h2>{t('forgotPassword.title')}</h2>
      <input
        type="email"
        placeholder={t('forgotPassword.input.emailPlaceholder')}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="auth-input"
      />
      <button onClick={handlePasswordReset} className="auth-button">
        {t('forgotPassword.buttons.resetPassword')}
      </button>
      {message && (
        <p className={`auth-message ${message.includes(t('forgotPassword.messages.success')) ? 'success' : 'error'}`}>
          {message}
        </p>
      )}
      <button onClick={handleBackToLogin} className="auth-button auth-back-button">
        {t('forgotPassword.buttons.backToLogin')}
      </button>
    </div>
  );
};

export default ForgotPassword;
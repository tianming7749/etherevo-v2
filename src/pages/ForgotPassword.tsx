import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import "./Auth.css";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handlePasswordReset = async () => {
    // 验证邮箱格式（可选，但推荐）
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('forgotPassword.messages.invalidEmail'));
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'http://34.118.249.177:5174/reset-password', // 确保指向重置密码页面
      });

      if (error) {
        if (error.message.includes('invalid')) {
          setError(t('forgotPassword.messages.invalidEmail'));
        } else if (error.message.includes('not found')) {
          setError(t('forgotPassword.messages.userNotFound'));
        } else {
          setError(t('forgotPassword.messages.error'));
        }
        console.error("Error resetting password:", error.message);
      } else {
        // 成功发送邮件后，存储 email 到 localStorage
        console.log('Storing email in localStorage:', email);
        localStorage.setItem('resetEmail', email);
        setSuccess(true);
        setError(null);
        setTimeout(() => navigate("/auth"), 3000); // 3 秒后返回登录页
      }
    } catch (err) {
      console.error("Unexpected error during password reset:", err);
      setError(t('forgotPassword.messages.error'));
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
        required
      />
      <button onClick={handlePasswordReset} className="auth-button" disabled={!email.trim()}>
        {t('forgotPassword.buttons.resetPassword')}
      </button>
      {error && <p className="auth-message error">{error}</p>}
      {success && (
        <>
          <p className="auth-message success">{t('forgotPassword.messages.success')}</p>
          <p className="auth-message info">{t('forgotPassword.messages.checkEmail', 'Please check your email for a password reset link.')}</p>
          <button onClick={handleBackToLogin} className="auth-button auth-back-button">
            {t('forgotPassword.buttons.backToLogin')}
          </button>
        </>
      )}
    </div>
  );
};

export default ForgotPassword;
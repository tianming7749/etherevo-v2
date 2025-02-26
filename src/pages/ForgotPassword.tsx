import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next'; // 导入 useTranslation
import "./Auth.css"; // 使用现有的 Auth.css

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation(); // 获取 t 函数

  const handlePasswordReset = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'http://34.118.249.177:5174/reset-password', // 确保指向重置密码页面
      });

      if (error) {
        setError(error.message || t('forgotPassword.messages.error'));
      } else {
        setSuccess(true);
        setTimeout(() => navigate("/auth"), 3000); // 缩短到 3 秒，优化用户体验
      }
    } catch (err) {
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
      <button onClick={handlePasswordReset} className="auth-button">
        {t('forgotPassword.buttons.resetPassword')}
      </button>
      {error && <p className="auth-message error">{error}</p>}
      {success && <p className="auth-message success">{t('forgotPassword.messages.success')}</p>}
      {success && (
        <button onClick={handleBackToLogin} className="auth-button auth-back-button">
          {t('forgotPassword.buttons.backToLogin')}
        </button>
      )}
    </div>
  );
};

export default ForgotPassword;
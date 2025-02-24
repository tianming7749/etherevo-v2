import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next'; // 导入 useTranslation
import './Auth.css'; // 使用 Auth.css 保持样式一致

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(); // 获取 t 函数
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  const handlePasswordReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError(t('resetPassword.messages.passwordMismatch'));
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser(
        { password },
        { accessToken: token } // 使用 token 验证请求
      );

      if (error) {
        setError(error.message); // Supabase 返回的错误消息可能需要额外翻译
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate('/auth');
        }, 3000); // 3秒后重定向
      }
    } catch (err) {
      setError(t('resetPassword.messages.unexpectedError'));
    }
  };

  if (!token) {
    return <div className="auth-container">{t('resetPassword.messages.invalidToken')}</div>;
  }

  if (success) {
    return <div className="auth-container">{t('resetPassword.messages.success')}</div>;
  }

  return (
    <div className="auth-container">
      <h2>{t('resetPassword.title')}</h2>
      {error && <p className="auth-message error">{error}</p>}
      <form onSubmit={handlePasswordReset}>
        <label htmlFor="newPassword">{t('resetPassword.labels.newPassword')}</label>
        <input
          id="newPassword"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="auth-input"
        />
        <label htmlFor="confirmNewPassword">{t('resetPassword.labels.confirmNewPassword')}</label>
        <input
          id="confirmNewPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="auth-input"
        />
        <button type="submit" className="auth-button">
          {t('resetPassword.buttons.resetPassword')}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
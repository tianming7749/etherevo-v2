import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next'; // 导入 useTranslation
import './ResetPassword.css'; // 创建或使用独立的 CSS 文件

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

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError(t('resetPassword.messages.invalidToken'));
        return;
      }

      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token,
          type: 'recovery',
        });

        if (error) {
          setError(t('resetPassword.messages.invalidToken'));
          return;
        }
      } catch (err) {
        setError(t('resetPassword.messages.unexpectedError'));
      }
    };

    verifyToken();
  }, [token]);

  const handlePasswordReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError(t('resetPassword.messages.passwordMismatch'));
      return;
    }

    try {
      const { error } = await supabase.auth.verifyOtp({
        token,
        type: 'recovery',
        newPassword: password, // 直接更新新密码
      });

      if (error) {
        setError(error.message || t('resetPassword.messages.unexpectedError'));
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(t('resetPassword.messages.unexpectedError'));
    }
  };

  if (!token) {
    return <div className="reset-password-container">{t('resetPassword.messages.invalidToken')}</div>;
  }

  if (success) {
    return (
      <div className="reset-password-container">
        <p>{t('resetPassword.messages.success')}</p>
        <button
          onClick={() => navigate('/auth')}
          className="reset-password-button"
        >
          {t('resetPassword.buttons.backToLogin')}
        </button>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <h2>{t('resetPassword.title')}</h2>
      {error && <p className="reset-password-error">{error}</p>}
      <form onSubmit={handlePasswordReset}>
        <label htmlFor="newPassword">{t('resetPassword.labels.newPassword')}</label>
        <input
          id="newPassword"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="reset-password-input"
          disabled={!token || !!error} // 根据 token 和 error 禁用
        />
        <label htmlFor="confirmNewPassword">{t('resetPassword.labels.confirmNewPassword')}</label>
        <input
          id="confirmNewPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="reset-password-input"
          disabled={!token || !!error} // 根据 token 和 error 禁用
        />
        <button type="submit" className="reset-password-button" disabled={!token || !!error}>
          {t('resetPassword.buttons.resetPassword')}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
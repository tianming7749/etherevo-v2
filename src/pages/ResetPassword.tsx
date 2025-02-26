import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import './ResetPassword.css';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // 添加加载状态
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  const redirectTo = queryParams.get('redirect_to');

  useEffect(() => {
    if (!token) {
      setError(t('resetPassword.messages.invalidToken'));
      setIsLoading(false);
      return;
    }
  
    const verifyToken = async () => {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token,
          type: 'recovery',
        });
  
        if (error) {
          if (error.message.includes('expired')) {
            setError(t('resetPassword.messages.expiredToken'));
          } else if (error.message.includes('invalid')) {
            setError(t('resetPassword.messages.invalidToken'));
          } else {
            setError(t('resetPassword.messages.unexpectedError'));
          }
          console.error('Token verification error:', error);
        } else {
          setError(null); // 令牌有效，清空任何错误
        }
      } catch (err) {
        console.error('Unexpected error during token verification:', err);
        setError(t('resetPassword.messages.unexpectedError'));
      } finally {
        setIsLoading(false); // 验证完成后停止加载
      }
    };
  
    verifyToken();
  }, [token, t]);

  const handlePasswordReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  
    if (!password || !confirmPassword) {
      setError(t('resetPassword.messages.requiredFields'));
      return;
    }
  
    if (password !== confirmPassword) {
      setError(t('resetPassword.messages.passwordMismatch'));
      return;
    }
  
    if (password.length < 8) {
      setError(t('resetPassword.messages.passwordRequirements'));
      return;
    }
  
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        token,
        type: 'recovery',
        newPassword: password,
      });
  
      if (error) {
        if (error.message.includes('expired')) {
          setError(t('resetPassword.messages.expiredToken'));
        } else if (error.message.includes('invalid')) {
          setError(t('resetPassword.messages.invalidToken'));
        } else {
          setError(error.message || t('resetPassword.messages.unexpectedError'));
        }
        console.error('Password reset error:', error);
      } else {
        setSuccess(true);
        setError(null);
      }
    } catch (err) {
      console.error('Unexpected error during password reset:', err);
      setError(t('resetPassword.messages.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="reset-password-container">{t('resetPassword.messages.loading')}</div>; // 显示加载提示
  }

  if (!token) {
    return <div className="reset-password-container">{t('resetPassword.messages.invalidToken')}</div>;
  }

  if (success) {
    return (
      <div className="reset-password-container">
        <p>{t('resetPassword.messages.success')}</p>
        <button
          onClick={() => redirectTo ? window.location.href = redirectTo : navigate('/auth')}
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
          disabled={isLoading || !!error}
        />
        <label htmlFor="confirmNewPassword">{t('resetPassword.labels.confirmNewPassword')}</label>
        <input
          id="confirmNewPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="reset-password-input"
          disabled={isLoading || !!error}
        />
        <button type="submit" className="reset-password-button" disabled={isLoading || !!error}>
          {t('resetPassword.buttons.resetPassword')}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
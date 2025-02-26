import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import { useUserContext } from '../context/UserContext'; 
import './ResetPassword.css';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { isAuthenticated, isPasswordRecovery, userId } = useUserContext(); // 增加 userId
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  const redirectTo = queryParams.get('redirect_to');

  useEffect(() => {
    // 如果用户已完全登录（非密码重置流程），阻止密码重置
    if (isAuthenticated && !isPasswordRecovery) {
      setError(t('resetPassword.messages.alreadyLoggedIn'));
      setIsLoading(false);
      return;
    }

    if (!token) {
      setError(t('resetPassword.messages.invalidToken'));
      setIsLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        console.log('Token being verified:', token);
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
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token, t, isAuthenticated, isPasswordRecovery]); // 移除 userId，因为它不是必需的依赖

  const handlePasswordReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isAuthenticated && !isPasswordRecovery) {
      setError(t('resetPassword.messages.alreadyLoggedIn'));
      return;
    }

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
      console.log('Resetting password with token:', token, 'and password:', password);
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
        // 密码重置成功后，更新用户状态
        setIsPasswordRecovery(false); // 完成密码重置，恢复正常状态
      }
    } catch (err) {
      console.error('Unexpected error during password reset:', err);
      setError(t('resetPassword.messages.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="reset-password-container">{t('resetPassword.messages.loading')}</div>;
  }

  if (!token) {
    return <div className="reset-password-container">{t('resetPassword.messages.invalidToken')}</div>;
  }

  if (isAuthenticated && !isPasswordRecovery) {
    return (
      <div className="reset-password-container">
        <p>{t('resetPassword.messages.alreadyLoggedIn')}</p>
        <button
          onClick={() => navigate('/auth')}
          className="reset-password-button"
        >
          {t('resetPassword.buttons.backToLogin')}
        </button>
      </div>
    );
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
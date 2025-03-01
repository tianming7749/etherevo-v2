import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
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
  const { isAuthenticated, isPasswordRecovery, setIsPasswordRecovery } = useUserContext();
  const queryParams = new URLSearchParams(location.search);
  const [searchParams] = useSearchParams();

  // 从路由状态或查询参数中获取 token 和 redirectTo
  const token = location.state?.token || queryParams.get('token');
  const redirectTo = location.state?.redirectTo || queryParams.get('redirect_to');

  // 从 localStorage 获取 email
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmailAndVerify = async () => {
      if (!token) {
        setError(t('resetPassword.messages.invalidToken'));
        setIsLoading(false);
        return;
      }

      // 优先从 localStorage 获取 email
      let storedEmail = localStorage.getItem('resetEmail');
      console.log('LocalStorage contents:', {
        resetEmail: storedEmail,
        allKeys: Object.keys(localStorage),
        domain: window.location.hostname,
        path: window.location.pathname
      });

      if (storedEmail) {
        // 去除可能的空格或换行符
        storedEmail = storedEmail.trim();
        console.log('Retrieved and trimmed email from localStorage:', storedEmail);
        setEmail(storedEmail);
      } else {
        // 如果 localStorage 没有 email，提示用户重新请求重置链接
        setError(t('resetPassword.messages.emailRequired', 'Email is required. Please request a new password reset link.'));
        setIsLoading(false);
        return;
      }

      // 验证 token
      if (isAuthenticated && !isPasswordRecovery) {
        setError(t('resetPassword.messages.alreadyLoggedIn'));
        setIsLoading(false);
        return;
      }

      try {
        console.log('Token being verified:', token, 'with email:', email);
        const { data, error } = await supabase.auth.verifyOtp({
          token,
          type: 'recovery',
          email, // 确保传递 email
        });

        console.log('Verify OTP response:', { data, error });

        if (error) {
          if (error.message.includes('expired')) {
            setError(t('resetPassword.messages.expiredToken'));
          } else if (error.message.includes('invalid')) {
            setError(t('resetPassword.messages.invalidToken'));
          } else {
            setError(t('resetPassword.messages.unexpectedError'));
            console.error('Detailed token verification error:', error.message, error);
          }
        } else {
          setError(null);
          console.log('Token verified successfully, data:', data);
          setIsPasswordRecovery(true);
        }
      } catch (err) {
        console.error('Unexpected error during token verification:', err);
        setError(t('resetPassword.messages.unexpectedError'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmailAndVerify();
  }, [token, t, isAuthenticated, isPasswordRecovery, setIsPasswordRecovery]);

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

    if (!email) {
      setError(t('resetPassword.messages.emailRequired'));
      return;
    }

    setIsLoading(true);
    try {
      console.log('Resetting password with token:', token, 'email:', email, 'and password:', password);
      const { data, error } = await supabase.auth.verifyOtp({
        token,
        type: 'recovery',
        email, // 确保传递 email
        newPassword: password,
      });

      console.log('Password reset response:', { data, error });

      if (error) {
        if (error.message.includes('expired')) {
          setError(t('resetPassword.messages.expiredToken'));
        } else if (error.message.includes('invalid')) {
          setError(t('resetPassword.messages.invalidToken'));
        } else {
          setError(error.message || t('resetPassword.messages.unexpectedError'));
          console.error('Detailed password reset error:', error.message, error);
        }
      } else {
        setSuccess(true);
        setError(null);
        setIsPasswordRecovery(false);
        localStorage.removeItem('resetEmail'); // 密码重置成功后清除 email
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
          onClick={() => redirectTo ? window.location.href = decodeURIComponent(redirectTo) : navigate('/auth')}
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
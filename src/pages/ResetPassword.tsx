import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import { useUserContext } from '../context/UserContext'; // 导入 UserContext
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
  const { userId, isPasswordRecovery } = useUserContext(); // 使用 userId 和 isPasswordRecovery
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  const redirectTo = queryParams.get('redirect_to');

  useEffect(() => {
    // 如果用户已登录（非密码重置流程），阻止密码重置
    if (userId && !isPasswordRecovery) {
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
  }, [token, t, userId, isPasswordRecovery]);

  const handlePasswordReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (userId && !isPasswordRecovery) {
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

  // ... 其余代码保持不变（渲染部分）
};

export default ResetPassword;
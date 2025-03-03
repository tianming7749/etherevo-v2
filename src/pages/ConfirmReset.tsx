// src/pages/ConfirmReset.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import { useUserContext } from '../context/UserContext'; // 导入 useUserContext

const ConfirmReset: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const confirmationUrl = searchParams.get('confirmation_url');
  const { setIsPasswordRecovery } = useUserContext(); // 获取 setIsPasswordRecovery

  useEffect(() => {
    if (!confirmationUrl) {
      setError(t('resetPassword.messages.invalidToken'));
    }
  }, [confirmationUrl, t]);

  const handleConfirm = async () => {
    if (!confirmationUrl) {
      setError(t('resetPassword.messages.invalidToken'));
      return;
    }

    setIsLoading(true);
    try {
      // 解析 confirmation_url 中的查询参数
      console.log('Parsing confirmation URL:', confirmationUrl);
      const url = new URL(confirmationUrl);
      const token = url.searchParams.get('token');
      const type = url.searchParams.get('type') || 'recovery'; // 默认值为 'recovery'
      const redirectTo = url.searchParams.get('redirect_to') || '/reset-password'; // 默认值为 '/reset-password'

      console.log('Parsed token, type, redirectTo:', { token, type, redirectTo });

      if (!token || type !== 'recovery') {
        setError(t('resetPassword.messages.invalidToken'));
        return;
      }

      // 验证 token，尝试添加 email 参数
      const email = 'yangtianming@yeah.net'; // 硬编码或从 localStorage/Context 获取
      console.log('Verifying token with email:', { token, type, email });
      const { data, error } = await supabase.auth.verifyOtp({
        token,
        type: 'recovery',
        email, // 添加 email 参数以尝试匹配后端要求
      });

      console.log('Verify OTP response:', { data, error }); // 添加详细日志

      if (error) {
        if (error.message.includes('expired')) {
          setError(t('resetPassword.messages.expiredToken'));
        } else if (error.message.includes('invalid')) {
          setError(t('resetPassword.messages.invalidToken'));
        } else {
          setError(t('resetPassword.messages.unexpectedError'));
          console.error('Token verification error:', error.message, error);
        }
      } else {
        // 验证成功，设置 isPasswordRecovery 为 true，并重定向到密码重置页面
        setIsPasswordRecovery(true); // 更新 UserContext 状态
        console.log('Token verified successfully, redirecting to reset-password');
        navigate(`/reset-password?token=${token}&type=recovery&redirect_to=${redirectTo}`);
      }
    } catch (err) {
      console.error('Error in confirm reset:', err);
      setError(t('resetPassword.messages.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>{t('resetPassword.messages.loading')}</div>;
  }

  return (
    <div className="confirm-reset-container">
      <h2>{t('resetPassword.titleConfirm')}</h2>
      {error && <p className="error">{error}</p>}
      <button onClick={handleConfirm} disabled={isLoading}>
        {t('resetPassword.buttons.confirmReset')}
      </button>
    </div>
  );
};

export default ConfirmReset;
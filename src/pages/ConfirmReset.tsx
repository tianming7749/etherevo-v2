// src/pages/ConfirmReset.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';

const ConfirmReset: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const confirmationUrl = searchParams.get('confirmation_url');

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
      const url = new URL(confirmationUrl);
      const token = url.searchParams.get('token');
      const type = url.searchParams.get('type');
      const redirectTo = url.searchParams.get('redirect_to');

      if (!token || type !== 'recovery') {
        setError(t('resetPassword.messages.invalidToken'));
        return;
      }

      // 验证 token
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
          console.error('Token verification error:', error.message, error);
        }
      } else {
        // 验证成功，重定向到密码重置页面
        navigate(`/reset-password?token=${token}&type=recovery&redirect_to=${redirectTo || '/auth'}`);
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
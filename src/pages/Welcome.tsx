// Welcome.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useUserContext } from "../context/UserContext";
import "./Welcome.css"; // 假设存在或创建新的 CSS 文件
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom'; // 导入 useNavigate

const Welcome: React.FC = () => {
  const { userId, setUserId } = useUserContext();
  const [setupCompleted, setSetupCompleted] = useState<boolean | null>(null);
  const [privacyAgreed, setPrivacyAgreed] = useState(false); // 添加隐私协议同意状态
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSetupStatus = async () => {
      if (!userId) return;

      const { data, error } = await supabase
        .from("user_settings")
        .select("setup_completed")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error checking setup status:", error);
        setSetupCompleted(false); // 假设未完成设置
      } else {
        setSetupCompleted(data?.setup_completed || false);
      }
    };

    checkSetupStatus();
  }, [userId]);

  useEffect(() => {
    if (setupCompleted === true) {
      // 如果设置已完成，跳转到 Chat 页面
      navigate('/chat');
    }
  }, [setupCompleted, navigate]);

  if (setupCompleted === null) {
    return <div className="welcome-loading">{t('welcome.loading')}</div>;
  }

  if (setupCompleted === true) {
    return null; // 防止渲染已完成设置的用户
  }

  const handleStartSetup = () => {
    if (!privacyAgreed) {
      alert(t('welcome.privacyRequired')); // 提示用户未同意隐私协议
      return;
    }
    navigate('/settings'); // 跳转到 Settings 页面开始设置流程
  };

  return (
    <div className="welcome-container">
      <h1>{t('welcome.title')}</h1>
      
      <div className="welcome-content">
        <h2>{t('welcome.featuresTitle')}</h2>
        <p>{t('welcome.featuresDescription')}</p>
        <ul>
          <li>{t('welcome.feature1')}</li>
          <li>{t('welcome.feature2')}</li>
          <li>{t('welcome.feature3')}</li>
          <li>{t('welcome.feature4')}</li>
        </ul>
      </div>

      <div className="welcome-privacy">
        <h2>{t('welcome.privacyTitle')}</h2>
        <p>{t('welcome.privacyDescription')}</p>
        <ul>
          <li>{t('welcome.privacyPoint1')}</li>
          <li>{t('welcome.privacyPoint2')}</li>
          <li>{t('welcome.privacyPoint3')}</li>
          <li>{t('welcome.privacyPoint4')}</li>
        </ul>
        <label>
          <input
            type="checkbox"
            checked={privacyAgreed}
            onChange={(e) => setPrivacyAgreed(e.target.checked)}
          />
          {t('welcome.privacyAgreement')}
        </label>
      </div>

      <button
        onClick={handleStartSetup}
        className="welcome-button"
        disabled={!privacyAgreed}
      >
        {t('welcome.startSetup')}
      </button>
    </div>
  );
};

export default Welcome;
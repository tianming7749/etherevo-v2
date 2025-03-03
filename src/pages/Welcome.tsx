import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useUserContext } from "../context/UserContext";
import "./Welcome.css"; // 使用新的 CSS 文件
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const Welcome: React.FC = () => {
  const { userId, setUserId } = useUserContext();
  const [setupCompleted, setSetupCompleted] = useState<boolean | null>(null);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
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
        setSetupCompleted(false);
      } else {
        setSetupCompleted(data?.setup_completed || false);
      }
    };

    checkSetupStatus();
  }, [userId]);

  useEffect(() => {
    if (setupCompleted === true) {
      navigate('/chat');
    }
  }, [setupCompleted, navigate]);

  if (setupCompleted === null) {
    return <div className="welcome-loading">{t('welcome.loading')}</div>;
  }

  if (setupCompleted === true) {
    return null;
  }

  const handleStartSetup = () => {
    if (!privacyAgreed) {
      alert(t('welcome.privacyRequired'));
      return;
    }
    navigate('/settings');
  };

  return (
    <div className="welcome-container">
      <h1 className="welcome-title">{t('welcome.title')}</h1>
      
      <div className="welcome-content">
        <h2 className="welcome-subtitle">{t('welcome.featuresTitle')}</h2>
        <p className="welcome-text">{t('welcome.featuresDescription')}</p>
        <ul className="welcome-list">
          <li className="welcome-item">{t('welcome.feature1')}</li>
          <li className="welcome-item">{t('welcome.feature2')}</li>
          <li className="welcome-item">{t('welcome.feature3')}</li>
          <li className="welcome-item">{t('welcome.feature4')}</li>
        </ul>
      </div>

      <div className="welcome-privacy">
        <h2 className="welcome-subtitle">{t('welcome.privacyTitle')}</h2>
        <p className="welcome-text">{t('welcome.privacyDescription')}</p>
        <ul className="welcome-list">
          <li className="welcome-item">{t('welcome.privacyPoint1')}</li>
          <li className="welcome-item">{t('welcome.privacyPoint2')}</li>
          <li className="welcome-item">{t('welcome.privacyPoint3')}</li>
          <li className="welcome-item">{t('welcome.privacyPoint4')}</li>
        </ul>
        <label className="welcome-privacy-label">
          <input
            type="checkbox"
            checked={privacyAgreed}
            onChange={(e) => setPrivacyAgreed(e.target.checked)}
            className="welcome-checkbox"
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
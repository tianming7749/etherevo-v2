import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import "./Auth.css";

const Auth: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);
  const validatePassword = (password: string) => password.length >= 8;

  const handleAuth = async () => {
    setLoading(true);
    setMessage("");

    if (!validateEmail(email)) {
      setMessage(t('auth.messages.invalidEmail'));
      setLoading(false);
      return;
    }
    if (!validatePassword(password)) {
      setMessage(t('auth.messages.shortPassword'));
      setLoading(false);
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setMessage(t('auth.messages.passwordMismatch'));
      setLoading(false);
      return;
    }

    try {
      let result;
      if (isLogin) {
        result = await supabase.auth.signInWithPassword({ email, password });
      } else {
        result = await supabase.auth.signUp({ email, password });
      }

      if (result.error) {
        setMessage(result.error.message);
      } else {
        setMessage(isLogin ? t('auth.messages.loginSuccess') : t('auth.messages.signUpSuccess'));

        if (isLogin) {
          const userId = result.data.user.id;

          const { data: settings, error: settingsError } = await supabase
            .from('user_settings')
            .select('setup_completed')
            .eq('user_id', userId)
            .single();

          if (settingsError) {
            console.error("Error checking user setup:", settingsError);
            navigate("/");
          } else if (settings?.setup_completed) {
            navigate("/chat");
          } else {
            navigate("/");
          }

          await supabase
            .from('user_settings')
            .upsert(
              {
                user_id: userId,
                setup_completed: settings?.setup_completed ?? false,
                privacy_confirmed: false,
              },
              { onConflict: 'user_id' }
            );

          localStorage.setItem("supabase.auth.token", JSON.stringify(result.data));
        } else {
          await supabase
            .from('user_settings')
            .insert({
              user_id: result.data.user.id,
              setup_completed: false,
              privacy_confirmed: false,
            });
          navigate("/");
        }
      }
    } catch (error) {
      setMessage(t('auth.messages.unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">{t('auth.title')}</h2>
      <h1 className="auth-subtitle">{isLogin ? t('auth.loginTitle') : t('auth.signUpTitle')}</h1>
      <div className="auth-form">
        <input
          type="email"
          placeholder={t('auth.inputs.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input"
        />
        <input
          type="password"
          placeholder={t('auth.inputs.passwordPlaceholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="auth-input"
        />
        {!isLogin && (
          <input
            type="password"
            placeholder={t('auth.inputs.confirmPasswordPlaceholder')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="auth-input"
          />
        )}
      </div>
      <button
        onClick={handleAuth}
        className="auth-button"
        disabled={loading}
      >
        {loading ? t('auth.buttons.loading') : (isLogin ? t('auth.buttons.login') : t('auth.buttons.signUp'))}
      </button>
      <p className="auth-toggle">
        {isLogin ? t('auth.toggle.noAccount') : t('auth.toggle.hasAccount')}
        <span onClick={() => setIsLogin(!isLogin)}>
          {" "}{isLogin ? t('auth.toggle.signUpLink') : t('auth.toggle.loginLink')}
        </span>
      </p>
      <a href="/forgot-password" className="auth-forgot-password">{t('auth.links.forgotPassword')}</a>
      {/* 语言切换改为文本链接 */}
      <span
        onClick={toggleLanguage}
        className="auth-forgot-password"
      >
        {i18n.language === 'zh' ? t('auth.languageSwitch.toEnglish') : t('auth.languageSwitch.toChinese')}
      </span>
      {message && (
        <p className={`auth-message ${message.includes(t('auth.messages.loginSuccess')) || message.includes(t('auth.messages.signUpSuccess')) ? 'success' : 'error'}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default Auth;
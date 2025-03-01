import React, { useState, useEffect } from "react";
import { useUserContext } from "./context/UserContext";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import Navbar from "./components/Navbar";
import Chat from "./pages/Chat/Chat";
import Settings from './components/Settings';
import TonesPage from "./pages/Tones/TonesPage";
import Auth from "./pages/Auth";
import Welcome from "./pages/Welcome";
import UserInfo from "./pages/UserInfo/UserInfo";
import BasicInfo from "./pages/UserInfo/BasicInfo/BasicInfo";
import HealthConditionPage from "./pages/UserInfo/HealthCondition/HealthConditionPage";
import InterestsPage from "./pages/UserInfo/Interests/InterestsPage";
import RecentEventsPage from "./pages/UserInfo/RecentEvents/RecentEventsPage";
import SocialSupportPage from "./pages/UserInfo/SocialSupport/SocialSupportPage";
import LifeEnvironment from "./pages/UserInfo/LifeEnvironment/LifeEnvironment";
import GoalsPage from "./pages/Goals/GoalsPage";
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import i18n from './i18n';
import { I18nextProvider } from 'react-i18next';

const App: React.FC = () => {
  const { isAuthenticated, isPasswordRecovery, userId, setUserId, loading } = useUserContext();
  const [activeButton, setActiveButton] = useState('Chat');
  const [setupCompleted, setSetupCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        setUserId(null);
      }
    });

    return () => {
      (authListener as any)?.unsubscribe?.();
    };
  }, [setUserId]);

  useEffect(() => {
    const checkSetupStatus = async () => {
      if (!userId) {
        setSetupCompleted(false);
        return;
      }

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

  // 如果 UserContext 或 i18n 未加载完成，显示加载指示器
  if (loading || isAuthenticated === undefined || isPasswordRecovery === undefined) {
    return <div>Loading...</div>;
  }

  return (
    <I18nextProvider i18n={i18n}>
      <Router>
        {isAuthenticated && !isPasswordRecovery && <Navbar activeButton={activeButton} onButtonClick={setActiveButton} />}
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/reset-password"
            element={
              isAuthenticated && !isPasswordRecovery ? <Navigate to="/" replace /> : <ResetPassword />
            }
          />
          <Route
            path="/auth/v1/verify"
            element={<Navigate to="/reset-password" replace state={{ token: new URLSearchParams(window.location.search).get('token'), type: 'recovery', redirectTo: new URLSearchParams(window.location.search).get('redirect_to') }} />}
          />
          <Route
            path="/"
            element={
              isAuthenticated && !isPasswordRecovery ? <Welcome setActiveButton={() => setActiveButton('Welcome')} /> : <Navigate to="/auth" replace />
            }
          />
          <Route
            path="/tones"
            element={
              isAuthenticated && !isPasswordRecovery ? <TonesPage setActiveButton={() => setActiveButton('Tones')} /> : <Navigate to="/auth" replace />
            }
          />
          <Route
            path="/chat"
            element={
              isAuthenticated && !isPasswordRecovery ? <Chat setActiveButton={() => setActiveButton('Chat')} /> : <Navigate to="/auth" replace />
            }
          />
          <Route
            path="/settings/*"
            element={
              isAuthenticated && !isPasswordRecovery ? <Settings /> : <Navigate to="/auth" replace />
            }
          >
            <Route path="tones" element={<TonesPage setActiveButton={() => setActiveButton('Tones')} />} />
            <Route path="goals" element={<GoalsPage setActiveButton={() => setActiveButton('Goals')} />} />
            <Route path="user-info/*" element={<UserInfo setActiveButton={() => setActiveButton('UserInfo')} />}>
              <Route index element={<BasicInfo />} />
              <Route path="basic-info" element={<BasicInfo />} />
              <Route path="environment" element={<LifeEnvironment />} />
              <Route path="health-condition" element={<HealthConditionPage />} />
              <Route path="interests" element={<InterestsPage />} />
              <Route path="recent-events" element={<RecentEventsPage />} />
              <Route path="social-support" element={<SocialSupportPage />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </I18nextProvider>
  );
};

export default App;
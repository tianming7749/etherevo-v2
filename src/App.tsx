import React, { useState, useEffect } from "react";
import { useUserContext } from "./context/UserContext";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
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
import i18n from './i18n'; //  ✅ 导入 i18n 配置文件
import { I18nextProvider } from 'react-i18next'; //  ✅ 导入 I18nextProvider

// 错误边界组件
const ErrorBoundaryFallback = () => {
  return (
    <div>
      <h1>Something went wrong.</h1>
      <p>Please try refreshing the page or contact support.</p>
    </div>
  );
};

const App: React.FC = () => {
  const { userId, setUserId } = useUserContext();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("supabase.auth.token"));
  const [activeButton, setActiveButton] = useState('Chat');
  const [setupCompleted, setSetupCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
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
        setSetupCompleted(false); // 未登录时假设未完成设置
        return;
      }

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

  // 如果加载中或设置状态未确定，显示加载指示器
  if (!userId && isLoggedIn) {
    return <div>Loading...</div>;
  }

  return (
    <I18nextProvider i18n={i18n}> {/* ✅ 使用 I18nextProvider 包裹 Router 组件，并传入 i18n 实例 */}
      <Router>
        {isLoggedIn && <Navbar activeButton={activeButton} onButtonClick={setActiveButton} />}
        <Routes>
          <Route path="/auth" element={isLoggedIn ? <Navigate to="/" replace /> : <Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/v1/verify" element={<ResetPassword />} />
          <Route path="/"
            element={isLoggedIn ?
              <Welcome setActiveButton={() => setActiveButton('Welcome')} /> :
              <Navigate to="/auth" replace />
            }
          />
          <Route path="/tones" element={isLoggedIn ?
            <TonesPage setActiveButton={() => setActiveButton('Tones')} /> :
            <Navigate to="/auth" replace />
          } />
          <Route path="/chat" element={isLoggedIn ?
            <Chat setActiveButton={() => setActiveButton('Chat')} /> :
            <Navigate to="/auth" replace />
          } />
          <Route
            path="/settings"
            element={isLoggedIn ? <Settings /> : <Navigate to="/auth" replace />}
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
          <Route path="/goals" element={isLoggedIn ?
            <GoalsPage setActiveButton={() => setActiveButton('Goals')} /> :
            <Navigate to="/auth" replace />
          } />
          <Route path="/user-info" element={isLoggedIn ?
            <UserInfo setActiveButton={() => setActiveButton('UserInfo')} /> :
            <Navigate to="/auth" replace />
          }>
            <Route index element={<BasicInfo />} />
            <Route path="basic-info" element={<BasicInfo />} />
            <Route path="environment" element={<LifeEnvironment />} />
            <Route path="health-condition" element={<HealthConditionPage />} />
            <Route path="interests" element={<InterestsPage />} />
            <Route path="recent-events" element={<RecentEventsPage />} />
            <Route path="social-support" element={<SocialSupportPage />} />
          </Route>
        </Routes>
      </Router>
    </I18nextProvider>
  );
};

export default App;
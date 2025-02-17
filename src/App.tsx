import React, { useState, useEffect } from "react";
import { useUserContext } from "./context/UserContext"; // 注意: 只引入 useUserContext, 不再引入 UserProvider
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import Navbar from "./components/Navbar";
import Chat from "./pages/Chat/Chat";
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


const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("supabase.auth.token"));
  const { userId, setUserId } = useUserContext(); // 只使用 useUserContext Hook, 不再引入 UserProvider 组件
  const [activeButton, setActiveButton] = useState('Welcome');

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

  // RedirectBasedOnSetup 组件已完全移除 !!! (RedirectBasedOnSetup Component is completely removed !!!)
  // const RedirectBasedOnSetup = () => { ... }  <--  删除整个组件定义 !!! (Delete the entire component definition !!!)


  return (

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

  );
};

export default App;
import React, { useState, useEffect } from "react";
import { UserProvider, useUserContext } from "./context/UserContext";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import Navbar from "./components/Navbar";
import Chat from "./pages/Chat/Chat";
import TonesPage from "./pages/Tones/TonesPage";
import Auth from "./pages/Auth";
import Welcome from "./pages/Welcome"; // 确保这一行被使用
import UserInfo from "./pages/UserInfo/UserInfo";
import BasicInfo from "./pages/UserInfo/BasicInfo/BasicInfo";
import HealthConditionPage from "./pages/UserInfo/HealthCondition/HealthConditionPage";
import InterestsPage from "./pages/UserInfo/Interests/InterestsPage";
import HabitsLifestylePage from "./pages/UserInfo/HabitsLifestyle/HabitsLifestylePage";
import RecentEventsPage from "./pages/UserInfo/RecentEvents/RecentEventsPage";
import SocialSupportPage from "./pages/UserInfo/SocialSupport/SocialSupportPage";
import LifeEnvironment from "./pages/UserInfo/LifeEnvironment/LifeEnvironment";
import GoalsPage from "./pages/Goals/GoalsPage";
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';


const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("supabase.auth.token"));
  const { userId, setUserId } = useUserContext();
  const [activeButton, setActiveButton] = useState('Welcome'); // 默认激活按钮

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

  const RedirectBasedOnSetup = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const checkUserSetup = async () => {
        if (!userId) {
          navigate("/auth");
          return;
        }
        
        setIsLoading(true); // 设置加载状态
        try {
          const { data: settings, error } = await supabase
            .from('user_settings')
            .select('setup_completed')
            .eq('user_id', userId)
            .single();

          if (error) {
            console.error("Error checking user setup:", error);
            navigate("/"); // 处理错误情况，回到欢迎页面
          } else if (settings?.setup_completed) {
            navigate("/chat"); // 老用户直接跳转到聊天
          } else {
            navigate("/"); // 新用户或未完成设置，直接跳转到欢迎页面
          }
        } catch (err) {
          console.error("Unexpected error:", err);
          navigate("/"); // 捕获所有未处理的错误，跳转到欢迎页面
        } finally {
          setIsLoading(false); // 结束加载状态
        }
      };
      checkUserSetup();
    }, [userId, navigate]);

    return isLoading ? <div>Loading...</div> : <Welcome />; // 如果加载中，显示Loading，否则显示Welcome页面
  };

  return (
    <UserProvider>
      <Router>
        {isLoggedIn && <Navbar activeButton={activeButton} onButtonClick={setActiveButton} />}
        <Routes>
          <Route path="/auth" element={isLoggedIn ? <Navigate to="/" replace /> : <Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
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
            <Route path="habits-lifestyle" element={<HabitsLifestylePage />} />
          </Route>
        </Routes>
      </Router>
    </UserProvider>
  );
};

export default App;
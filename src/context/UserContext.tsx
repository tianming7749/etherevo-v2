// UserContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

interface UserContextProps {
  userId: string | null; // 实际登录用户的 ID
  userName: string | null; // 实际登录用户的名称
  setUserId: (id: string | null) => void;
  loading: boolean;
  isPasswordRecovery: boolean; // 表示是否在密码重置流程中
  isAuthenticated: boolean; // 新增状态，明确用户是否完全登录
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false); // 是否在密码重置流程中
  const [isAuthenticated, setIsAuthenticated] = useState(false); // 是否完全登录

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log("Fetching user session...");
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log("Session data:", sessionData, "Session error:", sessionError);
        if (sessionError) {
          console.error("Error fetching session:", sessionError);
          setUserId(null);
          setUserName(null);
          setIsPasswordRecovery(false);
          setIsAuthenticated(false);
        } else if (!sessionData?.session) {
          console.log("User not logged in");
          setUserId(null);
          setUserName(null);
          setIsPasswordRecovery(false);
          setIsAuthenticated(false);
        } else {
          const user = sessionData.session.user;
          console.log("User session data:", user);
          setUserId(user.id || null);
          setUserName(user.email || user.user_metadata?.display_name || "User");
          setIsPasswordRecovery(false);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error in fetchUser:", error);
        setUserId(null);
        setUserName(null);
        setIsPasswordRecovery(false);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
        console.log("Loading state set to false, userId:", userId, "userName:", userName, "isPasswordRecovery:", isPasswordRecovery, "isAuthenticated:", isAuthenticated);
      }
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session);
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        setUserId(session?.user.id || null);
        setUserName(session?.user.email || session?.user.user_metadata?.display_name || "User");
        setIsPasswordRecovery(false);
        setIsAuthenticated(true);
        console.log("User signed in, userId:", session?.user.id, "userName:", session?.user.email);
      } else if (event === "SIGNED_OUT") {
        setUserId(null);
        setUserName(null);
        setIsPasswordRecovery(false);
        setIsAuthenticated(false);
        console.log("User signed out");
      } else if (event === "PASSWORD_RECOVERY") {
        // 仅设置密码重置状态，不更新用户登录状态
        setUserId(null);
        setUserName(null);
        setIsPasswordRecovery(true);
        setIsAuthenticated(false);
        console.log("Password recovery initiated");
      }
      setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ userId, userName, setUserId, loading, isPasswordRecovery, isAuthenticated }}>
      {loading ? <div>Loading...</div> : children}
    </UserContext.Provider>
  );
};

export const useUserContext = (): UserContextProps => {
  const context = useContext(UserContext);
  if (!context) {
    console.error("useUserContext must be used within a UserProvider");
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};
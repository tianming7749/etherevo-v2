// UserContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

interface UserContextProps {
  userId: string | null;
  userName: string | null;
  setUserId: (id: string | null) => void;
  loading: boolean;
  isPasswordRecovery: boolean; // 新增状态，表示是否在密码重置流程中
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false); // 新增状态

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
        } else if (!sessionData?.session) {
          console.log("User not logged in");
          setUserId(null);
          setUserName(null);
          setIsPasswordRecovery(false);
        } else {
          const user = sessionData.session.user;
          console.log("User session data:", user);
          setUserId(user.id || null);
          setUserName(user.email || user.user_metadata?.display_name || "User");
          setIsPasswordRecovery(false);
        }
      } catch (error) {
        console.error("Error in fetchUser:", error);
        setUserId(null);
        setUserName(null);
        setIsPasswordRecovery(false);
      } finally {
        setLoading(false);
        console.log("Loading state set to false, userId:", userId, "userName:", userName, "isPasswordRecovery:", isPasswordRecovery);
      }
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session);
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        setUserId(session?.user.id || null);
        setUserName(session?.user.email || session?.user.user_metadata?.display_name || "User");
        setIsPasswordRecovery(false);
        console.log("User signed in, userId:", session?.user.id, "userName:", session?.user.email);
      } else if (event === "SIGNED_OUT") {
        setUserId(null);
        setUserName(null);
        setIsPasswordRecovery(false);
        console.log("User signed out");
      } else if (event === "PASSWORD_RECOVERY") {
        // 在密码重置流程中，仅设置 isPasswordRecovery 为 true，不立即更新用户状态
        setIsPasswordRecovery(true);
        setUserId(null); // 临时清空用户状态，等待重置完成
        setUserName(null);
        console.log("Password recovery initiated");
      }
      setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ userId, userName, setUserId, loading, isPasswordRecovery }}>
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
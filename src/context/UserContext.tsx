import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

interface UserContextProps {
  userId: string | null; // 用户 ID
  setUserId: (id: string | null) => void; // 设置用户 ID
  loading: boolean; // 是否正在加载
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 首次获取用户信息
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data?.session) {
        console.log("用户未登录");
        setUserId(null);
      } else {
        setUserId(data.session.user.id);
      }
      setLoading(false);
    };

    fetchUser();

    // 监听认证状态的变化
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        // 如果用户登录或更新了信息
        setUserId(session?.user.id || null);
      } else if (event === "SIGNED_OUT") {
        // 用户登出
        setUserId(null);
      }
      setLoading(false);
    });

    // 清理监听器
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ userId, setUserId, loading }}>
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
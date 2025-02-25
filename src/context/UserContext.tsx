// UserContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

interface UserContextProps {
  userId: string | null;
  userName: string | null;
  setUserId: (id: string | null) => void;
  loading: boolean;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        } else if (!sessionData?.session) {
          console.log("User not logged in");
          setUserId(null);
          setUserName(null);
        } else {
          const user = sessionData.session.user;
          console.log("User session data:", user);
          setUserId(user.id || null); // 确保 user.id 存在
          setUserName(user.email || user.user_metadata?.display_name || "User");
        }
      } catch (error) {
        console.error("Error in fetchUser:", error);
        setUserId(null);
        setUserName(null);
      } finally {
        setLoading(false);
        console.log("Loading state set to false, userId:", userId, "userName:", userName);
      }
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session);
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        setUserId(session?.user.id || null);
        setUserName(session?.user.email || session?.user.user_metadata?.display_name || "User");
        console.log("User signed in, userId:", session?.user.id, "userName:", session?.user.email);
      } else if (event === "SIGNED_OUT") {
        setUserId(null);
        setUserName(null);
        console.log("User signed out");
      }
      setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ userId, userName, setUserId, loading }}>
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
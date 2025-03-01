import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

interface UserContextProps {
  userId: string | null;
  userName: string | null;
  setUserId: (id: string | null) => void;
  loading: boolean;
  isPasswordRecovery: boolean;
  isAuthenticated: boolean;
  error?: string | null;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log("Fetching user session...");
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log("Session data:", sessionData, "Session error:", sessionError);
        if (sessionError) {
          throw new Error(`Session error: ${sessionError.message}`);
        }
        if (!sessionData?.session) {
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
      } catch (err) {
        console.error("Error in fetchUser:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        setUserId(null);
        setUserName(null);
        setIsPasswordRecovery(false);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
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
        setError(null);
      } else if (event === "SIGNED_OUT") {
        setUserId(null);
        setUserName(null);
        setIsPasswordRecovery(false);
        setIsAuthenticated(false);
        setError(null);
      } else if (event === "PASSWORD_RECOVERY") {
        setUserId(null);
        setUserName(null);
        setIsPasswordRecovery(true);
        setIsAuthenticated(false);
        setError(null);
      }
      setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const value = { userId, userName, setUserId, loading, isPasswordRecovery, isAuthenticated, error };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUserContext = (): UserContextProps => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};
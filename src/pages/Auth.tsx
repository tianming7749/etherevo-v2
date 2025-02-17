import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

const Auth: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // 新增确认密码 state
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);
  const validatePassword = (password: string) => password.length >= 8;

  const handleAuth = async () => {
    setLoading(true);
    setMessage("");

    if (!validateEmail(email)) {
      setMessage("Please enter a valid email address.");
      setLoading(false);
      return;
    }
    if (!validatePassword(password)) {
      setMessage("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    if (!isLogin && password !== confirmPassword) { // 注册时检查确认密码
      setMessage("Passwords do not match.");
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
        setMessage(isLogin ? "Login successful!" : "Sign-up successful! Please check your email.");

        if (isLogin) {
          const userId = result.data.user.id;

          // 检查用户设置状态
          const { data: settings, error: settingsError } = await supabase
            .from('user_settings')
            .select('setup_completed')
            .eq('user_id', userId)
            .single();

          if (settingsError) {
            console.error("Error checking user setup:", settingsError);
            // 如果无法检查用户设置，默认跳转到欢迎页面
            navigate("/");
          } else if (settings?.setup_completed) {
            // 老用户直接跳转到聊天页面
            navigate("/chat");
          } else {
            // 新用户或未完成设置，跳转到欢迎页面
            navigate("/");
          }

          // 确保用户在user_settings中有记录
          await supabase
            .from('user_settings')
            .upsert({
              user_id: userId,
              setup_completed: settings?.setup_completed ?? false,
              privacy_confirmed: false
            },
            { onConflict: 'user_id' });

          localStorage.setItem("supabase.auth.token", JSON.stringify(result.data));
        } else {
          // 新注册的用户直接跳转到欢迎页面
          await supabase
            .from('user_settings')
            .insert({
              user_id: result.data.user.id,
              setup_completed: false,
              privacy_confirmed: false
            });
          navigate("/");
        }
      }
    } catch (error) {
      setMessage("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">Welcome to EtherEvo!</h2>
      <h1 className="auth-subtitle">{isLogin ? "Login" : "Sign Up"}</h1>
      <div className="auth-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="auth-input"
        />
        {/* 注册时显示确认密码输入框 */}
        {!isLogin && (
          <input
            type="password"
            placeholder="Confirm Password"
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
        {loading ? "Loading..." : (isLogin ? "Login" : "Sign Up")}
      </button>
      <p className="auth-toggle">
        {isLogin ? "Don't have an account?" : "Already have an account?"}
        <span onClick={() => setIsLogin(!isLogin)}> {isLogin ? "Sign Up" : "Login"}</span>
      </p>
      <a href="/forgot-password" className="auth-forgot-password">Forgot Password?</a>
      {message && <p className={`auth-message ${message.includes('success') ? 'success' : 'error'}`}>{message}</p>}
    </div>
  );
};

export default Auth;
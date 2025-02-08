import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // 假设你有这个文件导入Supabase客户端

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  const handlePasswordReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      }, { 
        // 使用token来验证这个请求是合法的
        accessToken: token 
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        // 可选：在成功重置后跳转到登录页面
        setTimeout(() => {
          navigate('/auth'); // 假设你有一个登录页面
        }, 3000); // 3秒后重定向，给用户时间看到成功消息
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    }
  };

  if (!token) {
    return <div>Invalid or missing token.</div>;
  }

  if (success) {
    return <div>Password has been successfully reset. You will be redirected to the login page shortly.</div>;
  }

  return (
    <div>
      <h2>Reset Your Password</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handlePasswordReset}>
        <label htmlFor="newPassword">New Password:</label>
        <input 
          id="newPassword" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        <br />
        <label htmlFor="confirmNewPassword">Confirm New Password:</label>
        <input 
          id="confirmNewPassword" 
          type="password" 
          value={confirmPassword} 
          onChange={(e) => setConfirmPassword(e.target.value)} 
          required 
        />
        <br />
        <button type="submit">Reset Password</button>
      </form>
    </div>
  );
};

export default ResetPassword;
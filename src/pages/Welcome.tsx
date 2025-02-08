import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useUserContext } from "../context/UserContext";
import PrivacyModal from "../components/PrivacyModal/PrivacyModal";
import "./Welcome.css";

interface WelcomeProps {
  setActiveButton: (button: string) => void;
}

const Welcome: React.FC<WelcomeProps> = ({ setActiveButton }) => {
  const [isPrivacyConfirmed, setIsPrivacyConfirmed] = useState(false);
  const navigate = useNavigate();
  const { userId } = useUserContext();

  useEffect(() => {
    // 仅在组件加载时设置activeButton状态
    setActiveButton('Welcome');
  }, [setActiveButton]);

  const handlePrivacyConfirmation = async () => {
    try {
      // 确认隐私条款逻辑
      await supabase.auth.updateUser({
        data: {
          privacy_confirmed: true
        }
      });

      setIsPrivacyConfirmed(true);

      // 检查用户设置状态
      const { data: settings, error } = await supabase
        .from('user_settings')
        .select('setup_completed')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error("Error checking user setup:", error);
        // 处理错误时可以选择跳转到默认页面或显示错误信息
        navigate("/tones"); // 假设错误时跳转到 tones 页面
        return;
      }

      if (!settings?.setup_completed) {
        navigate("/tones"); // 新用户跳转到基本信息页面
      } else {
        navigate("/chat"); // 老用户跳转到聊天页面
      }
    } catch (error) {
      console.error("Error confirming privacy:", error);
      alert("There was an error confirming the privacy policy.");
    }
  };

  return (
    <div>
      <PrivacyModal />
      <div className="content">
        <h1>欢迎使用 EtherEvo</h1>
        <h2>使用说明：</h2>
        <h3>1、请先在Tones之中选择希望的聊天方式</h3>
        <h3>2、在Goals之中设定目标</h3>
        <h3>3、在UserInfo之中完善您的各项信息（您填写的越完善，越有利于你得到更好的体验）。</h3>
        <h3>祝您生活愉快！</h3>
        {!isPrivacyConfirmed && (
          <button onClick={handlePrivacyConfirmation}>下一步</button>
        )}
        {/* 其他页面内容 */}
      </div>
    </div>
  );
};

export default Welcome;
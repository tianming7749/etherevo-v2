import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { v4 as uuidv4 } from 'uuid';

const useSessionManager = ({ userId }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const loadOrGenerateSessionId = async () => {
      if (userId) {
        const { data: session, error } = await supabase
          .from('sessions')
          .select('session_id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error || !session) {
          const newSessionId = uuidv4();
          const { data: insertData, error: insertError } = await supabase
            .from('sessions')
            .insert({ user_id: userId, session_id: newSessionId });
          if (insertError) {
            console.error('创建会话失败:', insertError);
          } else {
            setSessionId(newSessionId);
            console.log('新会话ID生成并插入:', newSessionId);
          }
        } else {
          setSessionId(session.session_id);
          console.log('已加载会话ID:', session.session_id);
        }
      }
    };

    loadOrGenerateSessionId();
  }, [userId]);

  return { sessionId };
};

export default useSessionManager;
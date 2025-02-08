import { supabase } from '../supabaseClient'; // 假设你有这个文件来初始化 Supabase 客户端

// 添加长期记忆
export const addLongTermMemory = async (userId, memoryData) => {
  const { data, error } = await supabase
    .from('memory_archive')
    .insert({
      user_id: userId,
      memory_data: memoryData
    });
  if (error) throw error;
  return data;
};

// 查询用户的所有长期记忆
export const getLongTermMemories = async (userId) => {
  const { data, error } = await supabase
    .from('memory_archive')
    .select('id, memory_data, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
};

// 更新长期记忆
export const updateLongTermMemory = async (id, userId, newMemoryData) => {
  const { data, error } = await supabase
    .from('memory_archive')
    .update({
      memory_data: newMemoryData,
      last_updated: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
  return data;
};
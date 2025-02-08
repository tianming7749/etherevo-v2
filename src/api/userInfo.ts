import { supabase } from "/src/supabaseClient";

export const saveBasicInfo = async (basicInfo: any) => {
  try {
    // 检查是否已经存在当前用户的记录
    const { data: existingData, error: fetchError } = await supabase
      .from("user_basic_info")
      .select("*")
      .eq("user_id", basicInfo.user_id)
      .single(); // 使用 single() 确保只返回一条记录

    if (fetchError && fetchError.code !== "PGRST116") {
      // 忽略 "PGRST116" (No rows found) 错误，其它错误则抛出
      throw fetchError;
    }

    let result;
    if (existingData) {
      // 如果记录存在，执行更新操作
      const { data, error } = await supabase
        .from("user_basic_info")
        .update(basicInfo)
        .eq("user_id", basicInfo.user_id);

      if (error) throw error;
      result = { success: true, data };
    } else {
      // 如果记录不存在，执行插入操作
      const { data, error } = await supabase
        .from("user_basic_info")
        .insert([basicInfo]);

      if (error) throw error;
      result = { success: true, data };
    }

    return result;
  } catch (error: any) {
    console.error("Error saving basic info:", error.message);
    return { success: false, error: error.message };
  }
};
import { supabase } from "../supabaseClient";

/**
 * Fetches and generates prompts for a given user.
 * @param userId - The user's unique ID (UUID).
 * @param aiId - The unique ID of the AI personality.
 * @returns A promise that resolves to the generated prompt string.
 */
export const generatePromptsForUser = async (userId: string, aiId: string): Promise<string> => {
  let prompt = "";
  let basicInfo;

  try {
    // Fetch user selected tones
    const { data: tones, error: tonesError } = await supabase
      .from("user_select_tones")
      .select("prompt_template")
      .eq("user_id", userId);

    if (tonesError) {
      throw new Error(`Failed to fetch tones: ${tonesError.message}`);
    }

    const tonesSummary = tones?.map(tone => `提示模板：${tone.prompt_template || "未填写"}`).join("\n") || "无提示模板";

    // Fetch basic information
    const { data: initialBasicInfo, error: basicInfoError } = await supabase
      .from("user_basic_info")
      .select("name, age_group, gender, occupation, current_location, birth_location, education, religions")
      .eq("user_id", userId)
      .maybeSingle();

    if (basicInfoError) {
      throw new Error(`Failed to fetch basic info: ${basicInfoError.message}`);
    }

    basicInfo = initialBasicInfo;

    // Handle case where user might not exist or basic info is not found
    if (!basicInfo) {
      await createNewUser(userId); // Assuming this function creates a new user record
      const { data: newBasicInfo } = await supabase
        .from("user_basic_info")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (!newBasicInfo) throw new Error("Failed to create or fetch new user's basic info");
      basicInfo = newBasicInfo;
    }

    // Fetch latest life environment
    const { data: lifeEnvironment, error: environmentError } = await supabase
      .from("life_environment")
      .select("stress_level, relationship_stress, financial_stress, sleep_quality, diet_satisfaction, additional_details")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (environmentError) {
      throw new Error(`Failed to fetch life environment: ${environmentError.message}`);
    }

    const relationshipStressString = lifeEnvironment?.relationship_stress
      ? lifeEnvironment.relationship_stress.map((rel: { type: string; status: string }) => `${rel.type}：${rel.status}`).join("，")
      : "未填写";

    const environmentSummary = lifeEnvironment ? `
      工作或学习压力：${lifeEnvironment.stress_level || "未填写"}，
      家庭关系或个人关系状况：${relationshipStressString}，
      经济压力：${lifeEnvironment.financial_stress || "未填写"}，
      睡眠质量：${lifeEnvironment.sleep_quality || "未填写"}，
      饮食满意度：${lifeEnvironment.diet_satisfaction || "未填写"}，
      其他详情：${lifeEnvironment.additional_details || "无"}。
    `.trim() : "无生活环境数据";

    // Fetch user HealthCondition
    const { data: healthCondition, error: healthConditionError } = await supabase
      .from("user_health_condition")
      .select("health_condition")
      .eq("user_id", userId)
      .maybeSingle();

    if (healthConditionError) {
      throw new Error(`获取健康状况失败: ${healthConditionError.message}`);
    }

    const healthConditionObject = healthCondition?.health_condition || {};
    let treatmentDetailsString = "无";
    if (Array.isArray(healthConditionObject.treatmentDetails)) {
      treatmentDetailsString = healthConditionObject.treatmentDetails.join("，");
    } else if (healthConditionObject.treatmentDetails) {
      treatmentDetailsString = healthConditionObject.treatmentDetails.toString();
    }

    const healthConditionSummary = `
      心理健康历史：${Array.isArray(healthConditionObject.mentalHealthHistory) ? healthConditionObject.mentalHealthHistory.join("，") : "无"}，
      是否在接受心理健康治疗：${healthConditionObject.isReceivingTreatment === true ? "是" : healthConditionObject.isReceivingTreatment === false ? "否" : "未填写"}，
      治疗细节：${treatmentDetailsString}，
      身体健康问题：${Array.isArray(healthConditionObject.physicalHealthIssues) ? healthConditionObject.physicalHealthIssues.join("，") : healthConditionObject.physicalHealthIssues || "无"}，
      是否服用药物：${healthConditionObject.isTakingMedication === true ? "是" : healthConditionObject.isTakingMedication === false ? "否" : "未填写"}，
      用药详情：${Array.isArray(healthConditionObject.medicationDetails) ? healthConditionObject.medicationDetails.join("，") : healthConditionObject.medicationDetails || "无"}，
    `.trim();

    // Fetch user interests
    const { data: interestsData, error: interestsError } = await supabase
      .from("user_interests")
      .select("interests")
      .eq("user_id", userId)
      .maybeSingle();

    if (interestsError) {
      throw new Error(`获取兴趣与爱好失败: ${interestsError.message}`);
    }

    const interestsObject = interestsData?.interests ? JSON.parse(interestsData.interests) : {};
    const interestsSummary = Object.entries(interestsObject).map(([category, interests]) => {
      return `${category}：${Array.isArray(interests) && interests.length > 0 ? interests.join("，") : "无兴趣"}`;
    }).join("\n") || "无兴趣与爱好数据";

    // Fetch user social support
    const { data: socialSupport, error: socialSupportError } = await supabase
      .from("user_social_support")
      .select("social_support")
      .eq("user_id", userId)
      .maybeSingle();

    if (socialSupportError) {
      throw new Error(`获取社交支持系统数据失败: ${socialSupportError.message}`);
    }

    const socialSupportObject = socialSupport?.social_support || {};
    const socialSupportSummary = `
      经常联系的家庭成员数量：${socialSupportObject.family || "未填写"}，
      好友数量：${socialSupportObject.friends || "未填写"}，
      打电话/发信息的频率：${socialSupportObject.callFrequency || "未填写"}，
      与朋友/家人见面的频率：${socialSupportObject.meetFrequency || "未填写"}。
    `.trim() || "无社交支持系统数据";

    // Fetch user habits and lifestyle
    const { data: habitsLifestyle, error: habitsLifestyleError } = await supabase
      .from("user_habits_lifestyle")
      .select("habits")
      .eq("user_id", userId)
      .maybeSingle();

    if (habitsLifestyleError) {
      throw new Error(`获取日常习惯和生活方式失败: ${habitsLifestyleError.message}`);
    }

    const habitsLifestyleObject = habitsLifestyle?.habits || {};
    const habitsLifestyleSummary = `
      饮食习惯：
        每天吃几餐：${habitsLifestyleObject.diet?.meals || "未填写"}，
        零食习惯：${habitsLifestyleObject.diet?.snacks || "未填写"}，
        饮食结构偏向：${habitsLifestyleObject.diet?.dietType || "未填写"}，
        每日水摄入量：${habitsLifestyleObject.diet?.waterIntake || "未填写"}，
      睡眠模式：
        平时几点起床：${habitsLifestyleObject.sleep?.wakeTime || "未填写"}，
        平时几点睡觉：${habitsLifestyleObject.sleep?.sleepTime || "未填写"}，
        睡眠时长：${habitsLifestyleObject.sleep?.sleepHours || "未填写"}，
        睡眠质量：${habitsLifestyleObject.sleep?.sleepQuality || "未填写"}，
      锻炼习惯：
        主要锻炼类型：${habitsLifestyleObject.exercise?.type || "未填写"}，
        每簇锻炼时长：${habitsLifestyleObject.exercise?.duration || "未填写"}，
        每周锻炼频率：${habitsLifestyleObject.exercise?.frequency || "未填写"}，
        锻炼强度：${habitsLifestyleObject.exercise?.intensity || "未填写"}。
    `.trim() || "无日常习惯和生活方式数据";

    // Fetch user recent events
    const { data: recentEvents, error: recentEventsError } = await supabase
      .from("user_recent_events")
      .select("recent_events")
      .eq("user_id", userId)
      .maybeSingle();

    if (recentEventsError) {
      throw new Error(`获取近期生活事件失败: ${recentEventsError.message}`);
    }

    const recentEventsObject = recentEvents?.recent_events || {};
    const recentEventsSummary = `
      是否最近搬了新家？${recentEventsObject.moving === true ? "是" : "否"}，
      失业或换工作？${recentEventsObject.jobChange === true ? "是" : "否"}，
      升职或降职？${recentEventsObject.promotion === true ? "是" : "否"}，
      开始或结束学业？${recentEventsObject.studyChange === true ? "是" : "否"}，
      结婚或离婚？${recentEventsObject.marriage === true ? "是" : "否"}，
      新生儿的到来或孩子离家？${recentEventsObject.newBaby === true ? "是" : "否"}，
      新的亲密关系或关系结束？${recentEventsObject.relationshipChange === true ? "是" : "否"}，
      是否有亲人或非常亲近的朋友去世？${recentEventsObject.bereavement === true ? "是" : "否"}，
      是否自己或家人经历了重大健康问题或诊断？${recentEventsObject.healthIssue === true ? "是" : "否"}，
      重大财务问题或改善？${recentEventsObject.financialChange === true ? "是" : "否"}，
      其他重大事件：${recentEventsObject.other || "无"}。
    `.trim() || "无近期重大生活事件";

    // Fetch user goals
    const { data: goals, error: goalsError } = await supabase
      .from("user_goals")
      .select("goals, priority")
      .eq("user_id", userId);

    if (goalsError) {
      throw new Error(`Failed to fetch goals: ${goalsError.message}`);
    }

    const goalsSummary = goals?.map(goal => {
      const goalList = JSON.parse(goal.goals || '[]');
      const goalText = goalList.length > 0 ? goalList.join(", ") : "未填写";
      return `目标：${goalText}，优先级：${goal.priority || "未填写"}`;
    }).join("\n") || "无目标";

    // Generate the complete prompt
    prompt = `
      
      ${tonesSummary}。

      用户希望达成如下
      ${goalsSummary}。

      基本信息：
      名字：${basicInfo.name || "未填写"}，
      年龄范围：${basicInfo.age_group || "未填写"}，
      性别：${basicInfo.gender || "未填写"}，
      职业：${basicInfo.occupation || "未填写"}，
      当前居住地：${basicInfo.current_location || "未填写"}，
      出生地：${basicInfo.birth_location || "未填写"}，
      教育背景：${basicInfo.education || "未填写"}，
      宗教信仰：${basicInfo.religions || "未填写"}。

      生活环境与压力源：
      ${environmentSummary}。

      健康状况：
      ${healthConditionSummary}。

      兴趣与爱好：
      ${interestsSummary}。

      社交支持系统：
      ${socialSupportSummary}。

      日常习惯和生活方式：
      ${habitsLifestyleSummary}。

      近期经历的重大事件：
      ${recentEventsSummary}。

    `.trim();

    // Save the generated prompt to the database
    const { error: saveError } = await supabase.from("user_prompts_summary").upsert({
      user_id: userId,
      prompt_template: tonesSummary,
      user_goals: goalsSummary,
      basic_info: `
        名字：${basicInfo.name || "未填写"}，
        年龄范围：${basicInfo.age_group || "未填写"}，
        性别：${basicInfo.gender || "未填写"}，
        职业：${basicInfo.occupation || "未填写"}，
        当前居住地：${basicInfo.current_location || "未填写"}，
        出生地：${basicInfo.birth_location || "未填写"}，
        教育背景：${basicInfo.education || "未填写"}，
        宗教信仰：${basicInfo.religions || "未填写"}。
      `.trim(),
      life_environment: environmentSummary,
      health_condition: healthConditionSummary,
      interests: interestsSummary,
      social_support: socialSupportSummary,
      habits_lifestyle: habitsLifestyleSummary,
      recent_events: recentEventsSummary,
      full_prompt: prompt,
    }, { onConflict: ["user_id"] });

    if (saveError) {
      throw new Error(`Failed to save prompt: ${saveError.message}`);
    }

    console.log("Prompt successfully generated and saved.");
    return prompt;
  } catch (error) {
    console.error("Error generating prompts:", error);
    throw error;
  }
};

// Helper function to create a new user if one does not exist
async function createNewUser(userId: string) {
  // Implement logic to insert new user data into relevant tables
  // This is a placeholder function; you should implement the actual logic based on your data model
  await supabase.from("user_basic_info").insert({ user_id: userId });
  // ... insert into other tables if needed
}
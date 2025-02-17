import { supabase } from "../supabaseClient";

export const generatePromptsForUser = async (userId: string): Promise<string> => {
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

    const tonesSummary = tones?.map(tone => `提示：${tone.prompt_template || "未填写"}`).join("\n") || "无提示";

    // Fetch basic information
    const { data: initialBasicInfo, error: basicInfoError } = await supabase
      .from("user_basic_info")
      .select("name, age_group, gender, occupation")
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
      .select("stress_level, relationship_stress, financial_stress, sleep_quality, additional_details")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (environmentError) {
      throw new Error(`Failed to fetch life environment: ${environmentError.message}`);
    }

    const relationshipStressString = lifeEnvironment?.relationship_stress
      ? lifeEnvironment.relationship_stress.map((rel: { type: string; status: string }) => `${rel.type}：${rel.status}`).join("，")
      : undefined; // 修改：无数据时返回 undefined

    // 修改 environmentSummary 构建逻辑
    const environmentSummary = lifeEnvironment ? [
      lifeEnvironment.stress_level ? `工作或学习压力：${lifeEnvironment.stress_level}` : null,
      relationshipStressString ? `家庭关系或个人关系状况：${relationshipStressString}` : null,
      lifeEnvironment.financial_stress ? `经济压力：${lifeEnvironment.financial_stress}` : null,
      lifeEnvironment.sleep_quality ? `睡眠质量：${lifeEnvironment.sleep_quality}` : null,
      lifeEnvironment.additional_details ? `其他详情：${lifeEnvironment.additional_details}` : null,
    ].filter(Boolean).join("\n") : null; // 修改：无数据时返回 null，并过滤和连接有效行


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

    // 修改 healthConditionSummary 构建逻辑
    const healthConditionSummary = [
      healthConditionObject.mentalHealthHistory && healthConditionObject.mentalHealthHistory.length > 0 ? `心理健康历史：${Array.isArray(healthConditionObject.mentalHealthHistory) ? healthConditionObject.mentalHealthHistory.join("，") : "无"}` : null,
      healthConditionObject.isReceivingTreatment !== undefined ? `是否在接受心理健康治疗：${healthConditionObject.isReceivingTreatment === true ? "是" : healthConditionObject.isReceivingTreatment === false ? "否" : "未填写"}` : null,
    ].filter(Boolean).join("\n") || null; // 修改：无数据时返回 null，并过滤和连接有效行


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
    // 修改 interestsSummary 构建逻辑
    const interestsSummary = Object.entries(interestsObject)
      .map(([category, interests]) => {
        if (Array.isArray(interests) && interests.length > 0) { // 只有当兴趣数组不为空时才返回字符串
          return `${category}：${interests.join("，")}`;
        } else {
          return null; //  否则返回 null
        }
      })
      .filter(Boolean) // 移除 null 值
      .join("\n") || null; // 修改：无有效数据时返回 null


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
    // 修改 socialSupportSummary 构建逻辑
    const socialSupportSummary = [
      socialSupportObject.family ? `经常联系的家庭成员数量：${socialSupportObject.family}` : null,
      socialSupportObject.friends ? `好友数量：${socialSupportObject.friends}` : null,
      socialSupportObject.meetFrequency ? `与朋友/家人见面的频率：${socialSupportObject.meetFrequency}` : null,
    ].filter(Boolean).join("\n") || null; // 修改：无数据时返回 null，并过滤和连接有效行


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
    // 修改 recentEventsSummary 构建逻辑
    let recentEventsSummary = null; // 初始化为 null
    const eventStrings: string[] = [];

    if (recentEventsObject) {

      if (recentEventsObject.moving === true) {
        eventStrings.push("最近搬了新家");
      }
      if (recentEventsObject.jobChange === true) {
        eventStrings.push("失业或换工作");
      }
      if (recentEventsObject.promotion === true) {
        eventStrings.push("升职或降职");
      }
      if (recentEventsObject.studyChange === true) {
        eventStrings.push("开始或结束学业");
      }
      if (recentEventsObject.marriage === true) {
        eventStrings.push("结婚或离婚");
      }
      if (recentEventsObject.newBaby === true) {
        eventStrings.push("新生儿的到来或孩子离家");
      }
      if (recentEventsObject.relationshipChange === true) {
        eventStrings.push("新的亲密关系或关系结束");
      }
      if (recentEventsObject.bereavement === true) {
        eventStrings.push("有亲人或非常亲近的朋友去世");
      }
      if (recentEventsObject.healthIssue === true) {
        eventStrings.push("自己或家人经历了重大健康问题或诊断");
      }
      if (recentEventsObject.financialChange === true) {
        eventStrings.push("重大财务问题或改善");
      }
      if (recentEventsObject.other) {
        eventStrings.push(`其他重大事件：${recentEventsObject.other}`);
      }

      if (eventStrings.length > 0) {
        recentEventsSummary = eventStrings.join("\n"); // 只有当有事件时才赋值
      }
    }


    // Fetch user goals
    const { data: goals, error: goalsError } = await supabase
      .from("user_goals")
      .select("goals")
      .eq("user_id", userId);

    if (goalsError) {
      throw new Error(`Failed to fetch goals: ${goalsError.message}`);
    }

    // 修改 goalsSummary 构建逻辑
    const goalsSummary = goals?.map(goal => {
      const goalList = JSON.parse(goal.goals || '[]');
      if (goalList.length > 0) { // 只有当目标列表不为空时才返回字符串
        const goalText = goalList.join(", ");
        return `希望达成如下目标：${goalText}`;
      } else {
        return null; // 否则返回 null
      }
    }).filter(Boolean).join("\n") || null; // 修改：无有效数据时返回 null


    // Generate the complete prompt
    prompt = `

      ${tonesSummary}。
      ${goalsSummary ? `\n用户\n${goalsSummary}` : ""}  ${/* 修改： 只有 goalsSummary 不为空时才添加 */''}

      基本信息：
      名字：${basicInfo.name || "未填写"}，
      年龄范围：${basicInfo.age_group || "未填写"}，
      性别：${basicInfo.gender || "未填写"}，
      职业：${basicInfo.occupation || "未填写"}，

      ${environmentSummary ? `\n生活环境与压力源：\n${environmentSummary}` : ""} ${/* 修改： 只有 environmentSummary 不为空时才添加 */''}

      ${healthConditionSummary ? `\n健康状况：\n${healthConditionSummary}` : ""} ${/* 修改： 只有 healthConditionSummary 不为空时才添加 */''}

      ${interestsSummary ? `\n兴趣与爱好：\n${interestsSummary}` : ""} ${/* 修改： 只有 interestsSummary 不为空时才添加 */''}

      ${socialSupportSummary ? `\n社交支持系统：\n${socialSupportSummary}` : ""} ${/* 修改： 只有 socialSupportSummary 不为空时才添加 */''}

      ${recentEventsSummary ? `\n近期经历的重大事件：\n${recentEventsSummary}` : ""} ${/* 修改： 只有 recentEventsSummary 不为空时才添加 */''}

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
      `.trim(),
      life_environment: environmentSummary,
      health_condition: healthConditionSummary,
      interests: interestsSummary,
      social_support: socialSupportSummary,
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
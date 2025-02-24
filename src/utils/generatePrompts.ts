// generatePrompts.ts
import { supabase } from "../supabaseClient";
import i18next from 'i18next';
import { fetchUserTone } from "./supabaseHelpers";

export const generatePromptsForUser = async (userId: string): Promise<string> => {
  let prompt = "";
  let basicInfo;

  try {
    // Fetch user selected tones
    const { data: tones, error: tonesError } = await supabase
      .from("user_select_tones")
      .select("prompt_template_key")
      .eq("user_id", userId);

    if (tonesError) {
      throw new Error(`Failed to fetch tones: ${tonesError.message}`);
    }

    const tonesSummary = tones?.map(tone => {
      const translationKey = `tonesPage.${tone.prompt_template_key}`;
      const translatedPrompt = i18next.t(translationKey);
      return translatedPrompt === translationKey ? tone.prompt_template_key : translatedPrompt;
    }).join("\n") || i18next.t('prompts.noPrompt');

    // Fetch basic information
    const { data: initialBasicInfo, error: basicInfoError } = await supabase
      .from("user_basic_info")
      .select("name, age_group, gender, gender_other, occupation, occupation_other")
      .eq("user_id", userId)
      .maybeSingle();

    if (basicInfoError) {
      throw new Error(`Failed to fetch basic info: ${basicInfoError.message}`);
    }

    basicInfo = initialBasicInfo;

    if (!basicInfo) {
      await createNewUser(userId);
      const { data: newBasicInfo } = await supabase
        .from("user_basic_info")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (!newBasicInfo) throw new Error("Failed to create or fetch new user's basic info");
      basicInfo = newBasicInfo;
    }

    // Translate basic info values
    const ageOptions = i18next.t('ageSelector.options', { returnObjects: true }) as Record<string, string>;
    const genderOptions = i18next.t('genderSelector.options', { returnObjects: true }) as Record<string, string>;
    const occupationOptions = i18next.t('occupationSelector.options', { returnObjects: true }) as Record<string, string>;

    const translatedBasicInfo = {
      name: basicInfo.name || i18next.t('prompts.notProvided'),
      age_group: basicInfo.age_group ? (ageOptions[basicInfo.age_group] || i18next.t('prompts.notProvided')) : i18next.t('prompts.notProvided'),
      gender: basicInfo.gender === "other" ? (basicInfo.gender_other || i18next.t('prompts.notProvided')) : (basicInfo.gender ? genderOptions[basicInfo.gender] || i18next.t('prompts.notProvided') : i18next.t('prompts.notProvided')),
      occupation: basicInfo.occupation === "other" ? (basicInfo.occupation_other || i18next.t('prompts.notProvided')) : (basicInfo.occupation ? occupationOptions[basicInfo.occupation] || i18next.t('prompts.notProvided') : i18next.t('prompts.notProvided')),
    };

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

    const stressLevelOptions = i18next.t('prompts.stressLevels', { returnObjects: true }) as Record<string, string>;
    const relationshipTypeOptions = i18next.t('prompts.relationshipTypes', { returnObjects: true }) as Record<string, string>;
    const relationshipStatusOptions = i18next.t('prompts.relationshipStatuses', { returnObjects: true }) as Record<string, string>;
    const financialStressOptions = i18next.t('prompts.financialStresses', { returnObjects: true }) as Record<string, string>;
    const sleepQualityOptions = i18next.t('prompts.sleepQualities', { returnObjects: true }) as Record<string, string>;

    const translatedRelationshipStress = lifeEnvironment?.relationship_stress
      ? lifeEnvironment.relationship_stress.map((rel: { type: string; status: string }) => 
          `${relationshipTypeOptions[rel.type] || rel.type}: ${relationshipStatusOptions[rel.status] || rel.status}`).join(", ")
      : undefined;

    const environmentSummary = lifeEnvironment ? [
      lifeEnvironment.stress_level ? `${i18next.t('prompts.environment.stressLevel')} ${stressLevelOptions[lifeEnvironment.stress_level] || i18next.t('prompts.notProvided')}` : null,
      translatedRelationshipStress ? `${i18next.t('prompts.environment.relationshipStress')} ${translatedRelationshipStress}` : null,
      lifeEnvironment.financial_stress ? `${i18next.t('prompts.environment.financialStress')} ${financialStressOptions[lifeEnvironment.financial_stress] || i18next.t('prompts.notProvided')}` : null,
      lifeEnvironment.sleep_quality ? `${i18next.t('prompts.environment.sleepQuality')} ${sleepQualityOptions[lifeEnvironment.sleep_quality] || i18next.t('prompts.notProvided')}` : null,
      lifeEnvironment.additional_details ? `${i18next.t('prompts.environment.additionalDetails')} ${lifeEnvironment.additional_details}` : null,
    ].filter(Boolean).join("\n") : null;

    // Fetch user HealthCondition
    const { data: healthCondition, error: healthConditionError } = await supabase
      .from("user_health_condition")
      .select("health_condition")
      .eq("user_id", userId)
      .maybeSingle();

    if (healthConditionError) {
      throw new Error(`Failed to fetch health condition: ${healthConditionError.message}`);
    }

    const healthConditionObject = healthCondition?.health_condition || {};
    let treatmentDetailsString = i18next.t('prompts.none');
    if (Array.isArray(healthConditionObject.treatmentDetails)) {
      treatmentDetailsString = healthConditionObject.treatmentDetails.join(", ");
    } else if (healthConditionObject.treatmentDetails) {
      treatmentDetailsString = healthConditionObject.treatmentDetails.toString();
    }

    const mentalHealthOptions = i18next.t('prompts.mentalHealthOptions', { returnObjects: true }) as Record<string, string>;
    const translatedMentalHealthHistory = healthConditionObject.mentalHealthHistory && healthConditionObject.mentalHealthHistory.length > 0
      ? healthConditionObject.mentalHealthHistory.map((condition: string) => mentalHealthOptions[condition] || condition).join(", ")
      : i18next.t('prompts.none');

    const healthConditionSummary = [
      healthConditionObject.mentalHealthHistory && healthConditionObject.mentalHealthHistory.length > 0 
        ? `${i18next.t('prompts.mentalHealthHistory')} ${translatedMentalHealthHistory}` 
        : null,
      healthConditionObject.isReceivingTreatment !== undefined 
        ? `${i18next.t('prompts.isReceivingTreatment')} ${healthConditionObject.isReceivingTreatment === true ? i18next.t('prompts.yes') : healthConditionObject.isReceivingTreatment === false ? i18next.t('prompts.no') : i18next.t('prompts.notProvided')}` 
        : null,
    ].filter(Boolean).join("\n") || null;

    // Fetch user interests
    const { data: interestsData, error: interestsError } = await supabase
      .from("user_interests")
      .select("interests")
      .eq("user_id", userId)
      .maybeSingle();

    if (interestsError) {
      throw new Error(`Failed to fetch interests: ${interestsError.message}`);
    }

    const interestsObject = interestsData?.interests ? JSON.parse(interestsData.interests) : {};
    const interestCategories = i18next.t('prompts.interestCategories', { returnObjects: true }) as Record<string, string>;
    const interestOptions = i18next.t('prompts.interestOptions', { returnObjects: true }) as Record<string, Record<string, string>>;

    const interestsSummary = Object.entries(interestsObject)
      .map(([category, interests]) => {
        if (Array.isArray(interests) && interests.length > 0) {
          const translatedInterests = interests.map(interest => 
            interestOptions[category] && interestOptions[category][interest] ? interestOptions[category][interest] : interest
          ).join(", ");
          return `${interestCategories[category] || category}: ${translatedInterests}`;
        }
        return null;
      })
      .filter(Boolean)
      .join("\n") || null;

    // Fetch user social support
    const { data: socialSupport, error: socialSupportError } = await supabase
      .from("user_social_support")
      .select("social_support")
      .eq("user_id", userId)
      .maybeSingle();

    if (socialSupportError) {
      throw new Error(`Failed to fetch social support: ${socialSupportError.message}`);
    }

    const socialSupportObject = socialSupport?.social_support || {};
    const numberOptions = i18next.t('socialSupportPage.numberOptions', { returnObjects: true }) as Record<string, string>;
    const frequencyOptions = i18next.t('socialSupportPage.frequencyOptions', { returnObjects: true }) as Record<string, string>;

    const socialSupportSummary = [
      socialSupportObject.family ? `${i18next.t('prompts.socialSupport.family')} ${numberOptions[socialSupportObject.family] || socialSupportObject.family}` : null,
      socialSupportObject.friends ? `${i18next.t('prompts.socialSupport.friends')} ${numberOptions[socialSupportObject.friends] || socialSupportObject.friends}` : null,
      socialSupportObject.meetFrequency ? `${i18next.t('prompts.socialSupport.meetFrequency')} ${frequencyOptions[socialSupportObject.meetFrequency] || socialSupportObject.meetFrequency}` : null,
    ].filter(Boolean).join("\n") || null;

    // Fetch user recent events
    const { data: recentEvents, error: recentEventsError } = await supabase
      .from("user_recent_events")
      .select("recent_events")
      .eq("user_id", userId)
      .maybeSingle();

    if (recentEventsError) {
      throw new Error(`Failed to fetch recent events: ${recentEventsError.message}`);
    }

    const recentEventsObject = recentEvents?.recent_events || {};
    let recentEventsSummary = null;
    const eventStrings: string[] = [];

    if (recentEventsObject) {
      if (recentEventsObject.moving === true) eventStrings.push(i18next.t('prompts.recentEventsDetails.moving'));
      if (recentEventsObject.jobChange === true) eventStrings.push(i18next.t('prompts.recentEventsDetails.jobChange'));
      if (recentEventsObject.promotion === true) eventStrings.push(i18next.t('prompts.recentEventsDetails.promotion'));
      if (recentEventsObject.studyChange === true) eventStrings.push(i18next.t('prompts.recentEventsDetails.studyChange'));
      if (recentEventsObject.marriage === true) eventStrings.push(i18next.t('prompts.recentEventsDetails.marriage'));
      if (recentEventsObject.newBaby === true) eventStrings.push(i18next.t('prompts.recentEventsDetails.newBaby'));
      if (recentEventsObject.relationshipChange === true) eventStrings.push(i18next.t('prompts.recentEventsDetails.relationshipChange'));
      if (recentEventsObject.bereavement === true) eventStrings.push(i18next.t('prompts.recentEventsDetails.bereavement'));
      if (recentEventsObject.healthIssue === true) eventStrings.push(i18next.t('prompts.recentEventsDetails.healthIssue'));
      if (recentEventsObject.financialChange === true) eventStrings.push(i18next.t('prompts.recentEventsDetails.financialChange'));
      if (recentEventsObject.other) eventStrings.push(`${i18next.t('prompts.recentEventsDetails.other')} ${recentEventsObject.other}`);
      if (eventStrings.length > 0) recentEventsSummary = eventStrings.join("\n");
    }

    // Fetch user goals
    const { data: goals, error: goalsError } = await supabase
      .from("user_goals")
      .select("goals")
      .eq("user_id", userId);

    if (goalsError) {
      throw new Error(`Failed to fetch goals: ${goalsError.message}`);
    }

    const goalsSummary = goals?.map(goal => {
      const goalList = JSON.parse(goal.goals || '[]');
      if (goalList.length > 0) {
        const goalText = goalList.map((g: string) => i18next.t(`goalsPage.predefinedGoals.${g}`)).join(", ");
        return `${i18next.t('prompts.goalsPrefix')} ${goalText}`;
      }
      return null;
    }).filter(Boolean).join("\n") || null;

    // Generate the complete prompt with translated values
    prompt = `
      ${tonesSummary}
      ${goalsSummary ? `\n${i18next.t('prompts.user')}\n${goalsSummary}` : ""}

      ${i18next.t('prompts.basicInfo')}
      ${i18next.t('prompts.name')} ${translatedBasicInfo.name},
      ${i18next.t('prompts.ageGroup')} ${translatedBasicInfo.age_group},
      ${i18next.t('prompts.gender')} ${translatedBasicInfo.gender},
      ${i18next.t('prompts.occupation')} ${translatedBasicInfo.occupation},

      ${environmentSummary ? `\n${i18next.t('prompts.lifeEnvironment')}\n${environmentSummary}` : ""}
      ${healthConditionSummary ? `\n${i18next.t('prompts.healthConditionTitle')}\n${healthConditionSummary}` : ""}
      ${interestsSummary ? `\n${i18next.t('prompts.interestsSection')}\n${interestsSummary}` : ""}
      ${socialSupportSummary ? `\n${i18next.t('prompts.socialSupportTitle')}\n${socialSupportSummary}` : ""}
      ${recentEventsSummary ? `\n${i18next.t('prompts.recentEvents')}\n${recentEventsSummary}` : ""}
    `.trim();

    // Save the generated prompt to the database
    const { error: saveError } = await supabase.from("user_prompts_summary").upsert({
      user_id: userId,
      prompt_template: tonesSummary,
      user_goals: goalsSummary,
      basic_info: `
        ${i18next.t('prompts.name')} ${translatedBasicInfo.name},
        ${i18next.t('prompts.ageGroup')} ${translatedBasicInfo.age_group},
        ${i18next.t('prompts.gender')} ${translatedBasicInfo.gender},
        ${i18next.t('prompts.occupation')} ${translatedBasicInfo.occupation}
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

    console.log("Prompt successfully generated and saved:", prompt);
    return prompt;
  } catch (error) {
    console.error("Error generating prompts:", error);
    throw error;
  }
};

// Helper function to create a new user if one does not exist
async function createNewUser(userId: string) {
  await supabase.from("user_basic_info").insert({ user_id: userId });
}
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../../supabaseClient";
import { generatePromptsForUser } from "../../../utils/generatePrompts";  
import { useUserContext } from "../../../context/UserContext";
import "./InterestsPage.css";
import { useTranslation } from 'react-i18next';

const InterestsPage: React.FC = () => {
  const { userId, loading } = useUserContext();
  const [userInterests, setUserInterests] = useState<Record<string, string[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement>>({});
  const { t } = useTranslation();

  const interestsData = t('interestsPage.categories', { returnObjects: true }) as Record<string, { title: string; options: Record<string, string> }>;
  const categoryKeys = Object.keys(interestsData);

  useEffect(() => {
    const fetchInterests = async () => {
      if (!userId) return;

      const { data, error } = await supabase
        .from("user_interests")
        .select("interests")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error fetching interests:", error);
      } else if (data) {
        const savedInterests = JSON.parse(data.interests);
        const updatedInterests = { ...savedInterests };

        categoryKeys.forEach((categoryKey) => {
          if (!updatedInterests[categoryKey]) {
            updatedInterests[categoryKey] = [];
          }
        });

        setUserInterests(updatedInterests);
      }
    };

    fetchInterests();
  }, [userId, categoryKeys]);

  const handleInterestChange = (category: string, interest: string, isChecked: boolean) => {
    const updatedCategory = userInterests[category] || [];
    const updatedInterests = isChecked
      ? [...new Set([...updatedCategory, interest])]
      : updatedCategory.filter((i) => i !== interest);

    setUserInterests((prev) => ({ ...prev, [category]: updatedInterests }));
  };

  const addUnsavedInputs = () => {
    const updatedInterests = { ...userInterests };

    Object.entries(inputRefs.current).forEach(([category, input]) => {
      const newInterest = input.value.trim();
      if (newInterest) {
        if (!updatedInterests[category]?.includes(newInterest)) {
          updatedInterests[category] = [...(updatedInterests[category] || []), newInterest];
        } else {
          console.warn("This interest already exists in the list!");
        }
      }
    });
    setUserInterests(updatedInterests);
  };

  const saveInterests = async () => {
    if (!userId) return;
  
    addUnsavedInputs();
  
    setUserInterests(prevState => {
      console.log('Ready to save interests:', prevState);
      saveData(prevState);
      return prevState;
    });

    async function saveData(updatedState) {
      setIsSaving(true);
    
      try {
        console.log('Saving interests (JSON):', JSON.stringify(updatedState));

        const { error } = await supabase
          .from("user_interests")
          .upsert(
            {
              user_id: userId,
              interests: JSON.stringify(updatedState),
            },
            { onConflict: "user_id" }
          );
    
        if (error) {
          console.error("Error saving interests:", error);
          alert(t('interestsPage.saveErrorAlert'));
          return;
        }
    
        const updatedPrompt = await generatePromptsForUser(userId);
        console.log("Generated prompt:", updatedPrompt);

        const { error: savePromptError } = await supabase
          .from("user_prompts_summary")
          .upsert({
            user_id: userId,
            full_prompt: updatedPrompt,
          }, { onConflict: ["user_id"] });

        if (savePromptError) {
          console.error("保存提示词失败：", savePromptError.message);
        } else {
          console.log("提示词已成功保存");
        }

        Object.values(inputRefs.current).forEach(input => input.value = "");

        const { data: checkData, error: checkError } = await supabase
          .from("user_interests")
          .select("interests")
          .eq("user_id", userId)
          .single();

        if (checkError) {
          console.error("Error checking saved data:", checkError);
        } else {
          console.log("Saved data verified:", checkData);
        }

        alert(t('interestsPage.saveSuccessAlert'));
      } catch (error) {
        console.error("Error during save process:", error);
        alert(t('interestsPage.saveNetworkErrorAlert'));
      } finally {
        setIsSaving(false);
      }
    };
  };

  if (loading) {
    return <p className="loading-message">{t('interestsPage.loadingMessage')}</p>;
  }
  
  return (
    <div className="interests-page">
      <div className="interests-grid">
        {categoryKeys.map((categoryKey) => (
          <div key={categoryKey} className="interest-category">
            <h3>{interestsData[categoryKey].title}</h3>
            <ul>
              {Object.keys(interestsData[categoryKey].options).map((interestKey) => (
                <li key={interestKey}>
                  <label>
                    <input
                      type="checkbox"
                      checked={userInterests[categoryKey]?.includes(interestKey) || false}
                      onChange={(e) => handleInterestChange(categoryKey, interestKey, e.target.checked)}
                    />
                    {interestsData[categoryKey].options[interestKey]}
                  </label>
                </li>
              ))}
              {userInterests[categoryKey]
                ?.filter((interest) => !Object.keys(interestsData[categoryKey].options).includes(interest))
                .map((extraInterest) => (
                  <li key={extraInterest}>
                    <label>
                      <input
                        type="checkbox"
                        checked
                        onChange={(e) => handleInterestChange(categoryKey, extraInterest, e.target.checked)}
                      />
                      {extraInterest}
                    </label>
                  </li>
                ))}
            </ul>
            <input
              type="text"
              placeholder={t('interestsPage.addInterestPlaceholder')}
              ref={(el) => (el ? (inputRefs.current[categoryKey] = el) : delete inputRefs.current[categoryKey])}
            />
          </div>
        ))}
      </div>
      <button onClick={saveInterests} disabled={isSaving}>
        {isSaving ? t('interestsPage.savingButton') : t('interestsPage.saveButton')}
      </button>
    </div>
  );
};

export default InterestsPage;
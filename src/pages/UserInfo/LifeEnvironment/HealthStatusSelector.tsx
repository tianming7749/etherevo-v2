import React from "react";

interface HealthStatusSelectorProps {
  sleepQuality: string;
  dietSatisfaction: string;
  onChange: (field: string, value: string) => void;
}

const HealthStatusSelector: React.FC<HealthStatusSelectorProps> = ({
  sleepQuality,
  dietSatisfaction,
  onChange,
}) => {
  const sleepOptions = ["很好", "一般", "差"];
  const dietOptions = ["非常满意", "满意", "一般", "不满意", "非常不满意"];

  const getSleepQualityClass = (option: string) => {
    return `sleep-quality-button ${sleepQuality === option ? 'sleep-quality-selected' : ''}`;
  };

  const getDietSatisfactionClass = (option: string) => {
    return `diet-satisfaction-button ${dietSatisfaction === option ? 'diet-satisfaction-selected' : ''}`;
  };

  return (
    <div className="health-status-selector">
      <label>健康状况：</label>
      <div>
        <label>睡眠质量：</label>
        <div className="button-group">
          {sleepOptions.map((option) => (
            <button
              key={option}
              className={getSleepQualityClass(option)}
              onClick={() => onChange("sleep_quality", option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label>饮食习惯：</label>
        <div className="button-group">
          {dietOptions.map((option) => (
            <button
              key={option}
              className={getDietSatisfactionClass(option)}
              onClick={() => onChange("diet_satisfaction", option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HealthStatusSelector;
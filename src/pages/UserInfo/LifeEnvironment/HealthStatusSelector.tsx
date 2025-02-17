import React from "react";

interface HealthStatusSelectorProps {
  sleepQuality: string;
  onChange: (field: string, value: string) => void;
}

const HealthStatusSelector: React.FC<HealthStatusSelectorProps> = ({
  sleepQuality,
  onChange,
}) => {
  const sleepOptions = ["很好", "一般", "差"];

  const getSleepQualityClass = (option: string) => {
    return `sleep-quality-button ${sleepQuality === option ? 'sleep-quality-selected' : ''}`;
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
    </div>
  );
};

export default HealthStatusSelector;
import React from "react";
import { useTranslation } from 'react-i18next';

interface StressLevelSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const StressLevelSelector: React.FC<StressLevelSelectorProps> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation();
  const options = t('stressLevelSelector.options', { returnObjects: true }) as Record<string, string>;
  const optionKeys = Object.keys(options);

  return (
    <div>
      <h3>{t('stressLevelSelector.title')}</h3>
      {optionKeys.map((key) => (
        <label key={key} style={{ marginRight: "10px" }}>
          <input
            type="radio"
            name="stress_level"
            value={key}
            checked={value === key}
            onChange={(e) => onChange(e.target.value)}
          />
          {options[key]}
        </label>
      ))}
    </div>
  );
};

export default StressLevelSelector;
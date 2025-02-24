import React from "react";
import { useTranslation } from 'react-i18next';

interface HealthStatusSelectorProps {
  sleepQuality: string;
  onChange: (field: string, value: string) => void;
}

const HealthStatusSelector: React.FC<HealthStatusSelectorProps> = ({
  sleepQuality,
  onChange,
}) => {
  const { t } = useTranslation();
  const sleepOptions = t('healthStatusSelector.sleepOptions', { returnObjects: true }) as Record<string, string>;
  const optionKeys = Object.keys(sleepOptions);

  return (
    <div className="health-status-selector">
      <div>
        <h3>{t('healthStatusSelector.sleepQualityTitle')}</h3>
        <div>
          {optionKeys.map((key) => (
            <label key={key} style={{ marginRight: "10px" }}>
              <input
                type="radio"
                name="sleep_quality"
                value={key}
                checked={sleepQuality === key}
                onChange={(e) => onChange("sleep_quality", e.target.value)}
              />
              {sleepOptions[key]}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HealthStatusSelector;
import React from "react";
import { useTranslation } from 'react-i18next';

interface AgeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const AgeSelector: React.FC<AgeSelectorProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const ageOptions = t('ageSelector.options', { returnObjects: true }) as Record<string, string>;
  const optionKeys = Object.keys(ageOptions);

  return (
    <div>
      <label>{t('ageSelector.label')}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{t('ageSelector.placeholder')}</option>
        {optionKeys.map((key) => (
          <option key={key} value={key}>
            {ageOptions[key]}
          </option>
        ))}
      </select>
    </div>
  );
};

export default AgeSelector;
import React from "react";
import { useTranslation } from 'react-i18next';

interface FinancialStressSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const FinancialStressSelector: React.FC<FinancialStressSelectorProps> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation();
  const options = t('financialStressSelector.options', { returnObjects: true }) as Record<string, string>;
  const optionKeys = Object.keys(options);

  return (
    <div>
      <h3>{t('financialStressSelector.title')}</h3>
      {optionKeys.map((key) => (
        <label key={key} style={{ marginRight: "10px" }}>
          <input
            type="radio"
            name="financial_stress"
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

export default FinancialStressSelector;
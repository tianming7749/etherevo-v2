import React, { useState } from "react";
import { useTranslation } from 'react-i18next';

interface GenderSelectorProps {
  value: string;
  otherValue: string; // 添加 otherValue 属性
  onChange: (field: string, value: string) => void;
  onOtherChange: (value: string) => void; // 添加 onOtherChange 属性
}

const GenderSelector: React.FC<GenderSelectorProps> = ({ value, otherValue, onChange, onOtherChange }) => {
  const { t } = useTranslation();
  const genderOptions = t('genderSelector.options', { returnObjects: true }) as Record<string, string>;
  const optionKeys = Object.keys(genderOptions);

  const handleGenderChange = (selectedValue: string) => {
    onChange("gender", selectedValue);
    if (selectedValue !== "other") {
      onOtherChange("");
    }
  };

  const handleOtherGenderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onOtherChange(inputValue);
  };

  return (
    <div>
      <label>{t('genderSelector.label')}</label>
      <select value={value} onChange={(e) => handleGenderChange(e.target.value)}>
        {optionKeys.map((key) => (
          <option key={key} value={key}>
            {genderOptions[key]}
          </option>
        ))}
      </select>

      {value === "other" && (
        <div>
          <label>{t('genderSelector.otherLabel')}</label>
          <input
            type="text"
            value={otherValue}
            onChange={handleOtherGenderChange}
            placeholder={t('genderSelector.placeholder')}
          />
        </div>
      )}

      <p style={{ fontSize: "0.9em", color: "#555" }}>
        {t('genderSelector.hint')}
      </p>
    </div>
  );
};

export default GenderSelector;
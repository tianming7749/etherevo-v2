import React from "react";
import { useTranslation } from 'react-i18next';

interface OccupationSelectorProps {
  value: string;
  otherValue: string;
  onChange: (field: string, value: string) => void;
  onOtherChange?: (value: string) => void; // 可选属性，与 BasicInfo 兼容
}

const OccupationSelector: React.FC<OccupationSelectorProps> = ({
  value,
  otherValue,
  onChange,
  onOtherChange,
}) => {
  const { t } = useTranslation();
  const occupationOptions = t('occupationSelector.options', { returnObjects: true }) as Record<string, string>;
  const optionKeys = Object.keys(occupationOptions);

  const handleOccupationChange = (selectedValue: string) => {
    onChange("occupation", selectedValue);
    if (selectedValue !== "other") {
      if (onOtherChange) {
        onOtherChange(""); // 如果有 onOtherChange，则调用
      } else {
        onChange("occupation_other", ""); // 否则直接通过 onChange 清空
      }
    }
  };

  const handleOtherChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    if (onOtherChange) {
      onOtherChange(text); // 如果有 onOtherChange，则调用
    } else {
      onChange("occupation_other", text); // 否则通过 onChange 更新
    }
  };

  return (
    <div>
      <h3>{t('occupationSelector.title')}</h3>
      <label>{t('occupationSelector.label')}</label>
      <select value={value} onChange={(e) => handleOccupationChange(e.target.value)}>
        {optionKeys.map((key) => (
          <option key={key} value={key}>
            {occupationOptions[key]}
          </option>
        ))}
      </select>
      {value === "other" && (
        <div>
          <label>{t('occupationSelector.otherLabel')}</label>
          <input
            type="text"
            value={otherValue}
            onChange={handleOtherChange}
            placeholder={t('occupationSelector.placeholder')}
          />
        </div>
      )}
      <p style={{ fontSize: "0.9em", color: "#555" }}>
        {t('occupationSelector.hint')}
      </p>
    </div>
  );
};

export default OccupationSelector;
import React from "react";
import { useTranslation } from 'react-i18next';

interface AdditionalDetailsInputProps {
  value: string;
  onChange: (value: string) => void; // 修改为直接接受 value 参数，与 LifeEnvironment 兼容
}

const AdditionalDetailsInput: React.FC<AdditionalDetailsInputProps> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation();

  return (
    <div>
      <label>{t('additionalDetailsInput.label')}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('additionalDetailsInput.placeholder')}
        rows={4}
        style={{ width: "100%", padding: "10px" }}
      />
    </div>
  );
};

export default AdditionalDetailsInput;
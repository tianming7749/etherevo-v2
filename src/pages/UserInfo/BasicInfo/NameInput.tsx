import React from "react";
import { useTranslation } from 'react-i18next';

interface NameInputProps {
  value: string;
  onChange: (name: string) => void;
}

const NameInput: React.FC<NameInputProps> = ({ value, onChange }) => {
  const { t } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div>
      <h3>{t('nameInput.label')}</h3>
      <p>{t('nameInput.hint')}</p>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={t('nameInput.placeholder')}
      />
    </div>
  );
};

export default NameInput;
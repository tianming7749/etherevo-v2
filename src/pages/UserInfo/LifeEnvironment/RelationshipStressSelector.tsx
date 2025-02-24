import React from "react";
import { useTranslation } from 'react-i18next';

interface Relationship {
  type: string;
  status: string;
}

interface RelationshipStressSelectorProps {
  value: Relationship[];
  onChange: (value: Relationship[]) => void;
}

const RelationshipStressSelector: React.FC<RelationshipStressSelectorProps> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation();
  const relationshipTypes = t('relationshipStressSelector.types', { returnObjects: true }) as Record<string, string>;
  const statusOptions = t('relationshipStressSelector.statusOptions', { returnObjects: true }) as Record<string, string>;
  const typeKeys = Object.keys(relationshipTypes);
  const statusKeys = Object.keys(statusOptions);

  const handleStatusChange = (type: string, status: string) => {
    const updatedValue = value.map((item) =>
      item.type === type ? { ...item, status } : item
    );

    if (!updatedValue.some((item) => item.type === type)) {
      updatedValue.push({ type, status });
    }

    onChange(updatedValue);
  };

  return (
    <div>
      <h3>{t('relationshipStressSelector.title')}</h3>
      {typeKeys.map((typeKey) => (
        <div key={typeKey} style={{ marginBottom: "10px" }}>
          <strong>{relationshipTypes[typeKey]}</strong>
          <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
            {statusKeys.map((statusKey) => (
              <label key={statusKey}>
                <input
                  type="radio"
                  name={`${typeKey}-status`}
                  checked={
                    value.find((item) => item.type === typeKey)?.status === statusKey
                  }
                  onChange={() => handleStatusChange(typeKey, statusKey)}
                />
                {statusOptions[statusKey]}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RelationshipStressSelector;
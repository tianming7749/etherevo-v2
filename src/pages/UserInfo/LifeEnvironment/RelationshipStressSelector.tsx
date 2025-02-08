import React from "react";

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
  const relationshipTypes = ["配偶", "父母", "子女", "朋友"];
  const statusOptions = ["和谐", "紧张", "冲突", "疏远"];

  // 更新某种关系的状况
  const handleStatusChange = (type: string, status: string) => {
    const updatedValue = value.map((item) =>
      item.type === type ? { ...item, status } : item
    );

    // 如果不存在，则添加新项
    if (!updatedValue.some((item) => item.type === type)) {
      updatedValue.push({ type, status });
    }

    onChange(updatedValue);
  };

  return (
    <div>
      <h3>家庭关系或个人关系状况</h3>
      {relationshipTypes.map((type) => (
        <div key={type} style={{ marginBottom: "10px" }}>
          <strong>{type}</strong>
          <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
            {statusOptions.map((status) => (
              <label key={status}>
                <input
                  type="radio"
                  name={`${type}-status`}
                  checked={
                    value.find((item) => item.type === type)?.status === status
                  }
                  onChange={() => handleStatusChange(type, status)}
                />
                {status}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RelationshipStressSelector;
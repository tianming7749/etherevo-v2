import React from "react";

interface AdditionalDetailsInputProps {
  value: string;
  onChange: (field: string, value: string) => void;
}

const AdditionalDetailsInput: React.FC<AdditionalDetailsInputProps> = ({
  value,
  onChange,
}) => {
  return (
    <div>
      <label>补充细节：</label>
      <textarea
        value={value}
        onChange={(e) => onChange("additional_details", e.target.value)}
        placeholder="如果你愿意，请简要描述你的压力源或健康问题..."
        rows={4}
        style={{ width: "100%", padding: "10px" }}
      />
    </div>
  );
};

export default AdditionalDetailsInput;
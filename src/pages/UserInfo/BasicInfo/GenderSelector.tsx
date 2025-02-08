import React, { useState } from "react";

interface GenderSelectorProps {
  value: string;
  onChange: (field: string, value: string) => void;
}

const GenderSelector: React.FC<GenderSelectorProps> = ({ value, onChange }) => {
  const [otherGender, setOtherGender] = useState<string>("");

  const handleGenderChange = (selectedValue: string) => {
    onChange("gender", selectedValue);
    if (selectedValue !== "其他") {
      setOtherGender("");
      onChange("gender_other", "");
    }
  };

  const handleOtherGenderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setOtherGender(inputValue);
    onChange("gender_other", inputValue);
  };

  return (
    <div>
      <label>性别：</label>
      <select value={value} onChange={(e) => handleGenderChange(e.target.value)}>
        <option value="">请选择</option>
        <option value="男性">男性</option>
        <option value="女性">女性</option>
        <option value="非二元性别">非二元性别</option>
        <option value="其他">其他（请说明）</option>
        <option value="不愿分享">不愿分享</option>
      </select>

      {value === "其他" && (
        <div>
          <label>请说明：</label>
          <input
            type="text"
            value={otherGender}
            onChange={handleOtherGenderChange}
            placeholder="请输入具体描述"
          />
        </div>
      )}

      <p style={{ fontSize: "0.9em", color: "#555" }}>
        提示：分享你的性别帮助我们调整对话内容，以更贴近你的体验和需求。
      </p>
    </div>
  );
};

export default GenderSelector;
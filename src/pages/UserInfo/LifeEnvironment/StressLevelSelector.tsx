import React from "react";

interface StressLevelSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const StressLevelSelector: React.FC<StressLevelSelectorProps> = ({
  value,
  onChange,
}) => {
  const options = ["低", "中", "高"];

  return (
    <div>
      <h3>工作或学习压力</h3>
      {options.map((option) => (
        <label key={option} style={{ marginRight: "10px" }}>
          <input
            type="radio"
            name="stress_level"
            value={option}
            checked={value === option}
            onChange={(e) => onChange(e.target.value)}
          />
          {option}
        </label>
      ))}
    </div>
  );
};

export default StressLevelSelector;
import React from "react";

interface FinancialStressSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const FinancialStressSelector: React.FC<FinancialStressSelectorProps> = ({
  value,
  onChange,
}) => {
  const options = ["无压力", "有一定压力", "压力很大"];

  return (
    <div>
      <h3>经济压力</h3>
      {options.map((option) => (
        <label key={option} style={{ marginRight: "10px" }}>
          <input
            type="radio"
            name="financial_stress"
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

export default FinancialStressSelector;
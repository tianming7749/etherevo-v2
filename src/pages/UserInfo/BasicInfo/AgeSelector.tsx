import React from "react";

interface AgeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const AgeSelector: React.FC<AgeSelectorProps> = ({ value, onChange }) => (
  <div>
    <label>年龄：</label>
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">请选择</option>
      <option value="18以下">18以下</option>
      <option value="18-24">18-24</option>
      <option value="25-34">25-34</option>
      <option value="35-44">35-44</option>
      <option value="45-54">45-54</option>
      <option value="55-64">55-64</option>
      <option value="65以上">65以上</option>
    </select>
  </div>
);

export default AgeSelector;
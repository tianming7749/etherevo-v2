import React from "react";

interface EducationSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const EducationSelector: React.FC<EducationSelectorProps> = ({ value, onChange }) => (
  <div>
    <label>教育程度：</label>
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">请选择</option>
      <option value="小学及以下">小学及以下</option>
      <option value="中学（初中/高中）">中学（初中/高中）</option>
      <option value="职业/技术学校">职业/技术学校</option>
      <option value="大专或本科（未完成）">大专或本科（未完成）</option>
      <option value="大专或本科（已完成）">大专或本科（已完成）</option>
      <option value="硕士或更高学位">硕士或更高学位</option>
      <option value="其他">其他（请说明）</option>
      <option value="不愿分享">不愿分享</option>
    </select>
    <p style={{ fontSize: "0.9em", color: "#555" }}>
      提示：了解你的教育程度可以帮助我们调整对话内容，使之更符合你的知识背景和可能的压力源。
    </p>
  </div>
);

export default EducationSelector;
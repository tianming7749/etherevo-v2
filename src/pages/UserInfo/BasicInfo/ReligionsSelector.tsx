import React from "react";

interface ReligionsSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const ReligionsSelector: React.FC<ReligionsSelectorProps> = ({ value, onChange }) => (
  <div>
    <label>宗教信仰：</label>
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">请选择</option>
      <option value="佛教">佛教</option>
      <option value="基督教">基督教</option>
      <option value="天主教">天主教</option>
      <option value="伊斯兰教">伊斯兰教</option>
      <option value="犹太教">犹太教</option>
      <option value="印度教">印度教</option>
      <option value="无宗教信仰">无宗教信仰</option>
      <option value="其他">其他</option>
      <option value="不愿分享">不愿分享</option>
    </select>
    <p style={{ fontSize: "0.9em", color: "#555" }}>
    提示：我们尊重你的信仰，如果你愿意分享，我们将根据你的信仰调整对话内容以提供更贴心的支持。
    </p>
  </div>
);

export default ReligionsSelector;
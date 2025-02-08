import React from "react";

interface OccupationSelectorProps {
  value: string; // 主职业字段的值
  otherValue: string; // “其他”选项对应的说明值
  onChange: (field: string, value: string) => void; // 更新父组件状态的回调函数
}

const occupationOptions = [
  "学生",
  "全职工作",
  "兼职工作",
  "自由职业者",
  "退休",
  "无工作/失业",
  "其他",
];

const OccupationSelector: React.FC<OccupationSelectorProps> = ({
  value,
  otherValue,
  onChange,
}) => {
  const handleOccupationChange = (selectedValue: string) => {
    onChange("occupation", selectedValue);
    // 如果用户选择的不是“其他”，清空其他说明字段
    if (selectedValue !== "其他") {
      onChange("occupation_other", "");
    }
  };

  const handleOtherChange = (text: string) => {
    onChange("occupation_other", text);
  };

  return (
    <div>
      <h3>职业（或学生）</h3>
      <label>你目前从事什么职业，或者你是学生吗？</label>
      <select value={value} onChange={(e) => handleOccupationChange(e.target.value)}>
        <option value="">请选择</option>
        {occupationOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {value === "其他" && (
        <div>
          <label>其他（请说明）：</label>
          <input
            type="text"
            value={otherValue}
            onChange={(e) => handleOtherChange(e.target.value)}
            placeholder="请描述你的职业状态"
          />
        </div>
      )}
      <p style={{ fontSize: "0.9em", color: "#555" }}>
        提示：了解你的职业状态可以让我们更有效地讨论与工作或学习相关的心理健康问题。
      </p>
    </div>
  );
};

export default OccupationSelector;
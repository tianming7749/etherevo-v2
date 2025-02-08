import React from "react";

interface NameInputProps {
  value: string; // 接收父组件传递的值
  onChange: (name: string) => void; // 触发父组件的状态更新
}

const NameInput: React.FC<NameInputProps> = ({ value, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value); // 将输入的值传递给父组件
  };

  return (
    <div>
      <h3>姓名</h3>
      <p>你希望别人叫你什么名字？这可以是你的真名、昵称或任何你希望被称呼的名字。</p>
      <input
        type="text"
        value={value} // 使用父组件传递的值
        onChange={handleChange} // 触发父组件的状态更新
        placeholder="请输入你的名字"
      />
    </div>
  );
};

export default NameInput;
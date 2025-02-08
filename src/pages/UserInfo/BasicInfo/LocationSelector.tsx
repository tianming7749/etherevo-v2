import React, { useState } from "react";

// 模拟国家和地区列表
const countryList = [
  "中国",
  "美国",
  "英国",
  "日本",
  "法国",
  "德国",
  "澳大利亚",
  "加拿大",
  "印度",
  "巴西",
  "其他",
  "不愿分享",
];

interface LocationSelectorProps {
  currentLocation: string;
  birthLocation: string;
  onChange: (field: string, value: string) => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  currentLocation,
  birthLocation,
  onChange,
}) => {
  const [isSameAsCurrent, setIsSameAsCurrent] = useState<boolean>(false);

  const handleCurrentLocationChange = (value: string) => {
    onChange("current_location", value);
    if (isSameAsCurrent) {
      onChange("birth_location", value);
    }
  };

  const handleBirthLocationChange = (value: string) => {
    if (value === "与居住地相同") {
      setIsSameAsCurrent(true);
      onChange("birth_location", currentLocation);
    } else {
      setIsSameAsCurrent(false);
      onChange("birth_location", value);
    }
  };

  return (
    <div>
      <h3>居住地（国家或地区）</h3>
      <label>你现在住在哪个国家或地区？</label>
      <select
        value={currentLocation}
        onChange={(e) => handleCurrentLocationChange(e.target.value)}
      >
        <option value="">请选择</option>
        {countryList.map((country) => (
          <option key={country} value={country}>
            {country}
          </option>
        ))}
      </select>
      <p style={{ fontSize: "0.9em", color: "#555" }}>
        提示：你的居住地信息帮助我们理解你可能面临的特定文化或环境因素，提供更相关的心理健康支持。
      </p>

      <h3>出生地（国家或地区）</h3>
      <label>你出生在哪个国家或地区？</label>
      <select
        value={isSameAsCurrent ? "与居住地相同" : birthLocation}
        onChange={(e) => handleBirthLocationChange(e.target.value)}
      >
        <option value="">请选择</option>
        <option value="与居住地相同">与居住地相同</option>
        {countryList.map((country) => (
          <option key={country} value={country}>
            {country}
          </option>
        ))}
      </select>
      <p style={{ fontSize: "0.9em", color: "#555" }}>
        提示：知道你的出生地可以帮助我们更好地理解你的文化背景，提供更贴合你需求的心理健康支持。你可以选择不分享，或选择与居住地一致。
      </p>
    </div>
  );
};

export default LocationSelector;
import React from "react";
import { createRoot } from "react-dom/client"; // 引入 createRoot
import "./index.css";
import App from "./App";
import { UserProvider } from "./context/UserContext";

const container = document.getElementById("root"); // 获取根节点
if (container) {
  const root = createRoot(container); // 创建根
  root.render(
    <React.StrictMode>
      <UserProvider>
        <App />
      </UserProvider>
    </React.StrictMode>
  );
}
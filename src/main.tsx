import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { UserProvider } from "./context/UserContext";
import { initI18n } from "./i18n"; // 导入 initI18n

const container = document.getElementById("root");
if (container) {
  initI18n().then(() => {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <UserProvider>
          <App />
        </UserProvider>
      </React.StrictMode>
    );
  }).catch((error) => {
    console.error("Failed to initialize i18n:", error);
  });
}
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

document.documentElement.dataset.runtime = window.__TAURI_INTERNALS__ ? "tauri" : "browser";
document.documentElement.dataset.surface =
  new URLSearchParams(window.location.search).get("surface") ?? "main";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

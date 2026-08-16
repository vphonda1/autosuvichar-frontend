import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ── Service Worker — इसी से app install होने लायक बनता है ──────────
// ⚠️ सिर्फ़ production में। dev में चलाने से पुरानी files अटक जाती हैं।
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then((reg) => {
        console.log("[PWA] तैयार");
        // हर घंटे देख लो कि नया version आया क्या
        setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
      })
      .catch((e) => console.warn("[PWA] register नहीं हुआ:", e.message));
  });
}

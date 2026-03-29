import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initStore } from "./lib/store";

initStore().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
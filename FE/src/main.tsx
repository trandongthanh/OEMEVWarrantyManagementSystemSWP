import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Import api utilities to register global axios interceptors
import "@/utils/api";

createRoot(document.getElementById("root")!).render(<App />);

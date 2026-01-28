import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./lib/socket"; // Initialize socket

createRoot(document.getElementById("root")!).render(<App />);

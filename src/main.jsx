import { createRoot } from "react-dom/client";
import App from './App.jsx';
import "./index.css";

// Disable right-click across the entire application
document.addEventListener('contextmenu', event => event.preventDefault());

createRoot(document.getElementById("root")).render(<App />);
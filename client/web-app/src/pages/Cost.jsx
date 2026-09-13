import React from "react";
import NavBar from "../components/NavBar";
import CostCalculation from "../components/CostCalculation";
import { useTheme } from "../context/ThemeContext";

import "../styles/Root.css";
import "../styles/Buttons.css";
import "../styles/Elements.css";
import "../styles/Fonts.css";
import "../styles/Forms.css";
import "../styles/NavBar.css";
import "../styles/Sidebar.css";
import "../styles/Tables.css";
import "../styles/Validation.css";

export default function Cost() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isDark ? "bg-black text-white" : "bg-white text-slate-900"
      }`}
    >
      <NavBar />

      <div
        className={`background-image ${
          isDark ? "bg-black" : "bg-white"
        }`}
      />

      <CostCalculation />
    </div>
  );
}
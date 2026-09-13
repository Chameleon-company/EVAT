import React from "react";
import NavBar from "../components/NavBar";
import CostCalculation from "../components/CostCalculation";

// import '../styles/Buttons.css';
// import '../styles/Elements.css';
// import '../styles/Fonts.css';
// import '../styles/Forms.css';
// import '../styles/NavBar.css';
// import '../styles/Sidebar.css';
// import '../styles/Tables.css';
// import '../styles/Validation.css';

export default function Cost() {
  return (
    <div className="min-h-screen overflow-x-hidden transition-colors">
      <NavBar />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-96 w-160 -translate-x-1/2 rounded-full bg-emerald-100/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-emerald-50/50 blur-3xl" />
      </div>

      <CostCalculation />
    </div>
  );
}
import React from "react";
import NavBar from "../components/NavBar";
import PersonalisedInsightsFormComponent from "../components/PersonalisedInsightsFormComponent";

export default function PersonalisedInsightsForm() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-black dark:text-white">
      <NavBar />
      <PersonalisedInsightsFormComponent />
    </div>
  );
}

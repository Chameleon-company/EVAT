import React from "react";
import NavBar from "../components/NavBar";
import TripConfidenceCard from "../components/TripConfidenceCard";

import '../styles/Root.css';
import '../styles/Buttons.css';
import '../styles/Elements.css';
import '../styles/Fonts.css';
import '../styles/Forms.css';
import '../styles/NavBar.css';
import '../styles/Sidebar.css';
import '../styles/Tables.css';
import '../styles/Validation.css';

export default function TripConfidence() {
  return (
    <div>
      <NavBar />
      {/* background */}
      <div className="background-image" />
      <TripConfidenceCard />
    </div>
  );
}
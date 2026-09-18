import React from "react";
import NavBar from "../components/NavBar";
import TripConfidenceCard from "../components/TripConfidenceCard";

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

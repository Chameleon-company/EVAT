import React from "react";
import NavBar from "../components/NavBar";
import WeatherMapComponent from "../components/WeatherMapComponent"

export default function WeatherAwareRouting() {
    return(
        <div>
            <NavBar />
            <WeatherMapComponent />
        </div>
    );
}
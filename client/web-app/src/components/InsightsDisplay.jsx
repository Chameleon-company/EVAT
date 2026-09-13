import React, { useState, useEffect } from "react";
import BarChart from "./BarChart";
import { getMyInsights } from "../services/personalisedEvInsightsService";
import { useNavigate } from 'react-router-dom';

import "../styles/Root.css";
import "../styles/Fonts.css";
import "../styles/Elements.css";
import "../styles/Tables.css";
import "../styles/PersonalisedInsights.css"
import "../styles/Buttons.css"

function Savings({estimatedSave, savingsMessage}) {
    if (estimatedSave != 0) {
        return (
            <div>
                <p className="text-xlarge text-center orange">Your potential EV savings</p>
                <p className="text-center">Based on your responses, you could save around</p>
                <p className="text-center text-xlarge green">${estimatedSave}</p>
                <p className="text-center">per month on fuel alone.</p>
            </div>
        )
    }
    else {
        return (
            <div>
                <p className="text-xlarge text-center orange">Your potential EV savings</p>
                <p className="text-center">{savingsMessage || "Switching savings do not apply to your current situation."}</p>
            </div>
        )
    }
}

function SuitabilitySummary({ data }) {
    if (!Number.isFinite(data.evReadinessScore)) return null;

    return (
        <section className="suitability-summary" aria-labelledby="suitability-heading">
            <div className="suitability-score" aria-label={`EV readiness score ${data.evReadinessScore} out of 100`}>
                <strong>{data.evReadinessScore}</strong>
                <span>/100</span>
            </div>
            <div className="suitability-copy">
                <p className="suitability-kicker">EV readiness recommendation</p>
                <h2 id="suitability-heading">{data.recommendationCategory}</h2>
                <p>{data.personalisedPredictionInsight}</p>
            </div>
            <div className="suitability-metrics">
                <div>
                    <span>Annual savings</span>
                    <strong>${Number(data.estimatedAnnualSavings || 0).toLocaleString()}</strong>
                </div>
                <div>
                    <span>Annual EV charging</span>
                    <strong>${Number(data.estimatedAnnualEvChargingCost || 0).toLocaleString()}</strong>
                </div>
                <div>
                    <span>Annual CO₂ reduction</span>
                    <strong>{Number(data.estimatedAnnualCo2ReductionKg || 0).toLocaleString()} kg</strong>
                </div>
            </div>
            <p className="suitability-disclaimer">
                This is a first-stage suitability estimate based on your responses and documented assumptions, not a prediction of real-world EV adoption.
            </p>
        </section>
    );
}

export default function InsightsDisplay() {
    const navigate = useNavigate();
    const tokenFull = localStorage.getItem("currentUser");
    const token = tokenFull ? JSON.parse(tokenFull).token : null;

    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Get the data from the backend
    useEffect(() => {
        const loadInsightData = async () => {
            try {
                const response = await getMyInsights(token);
                setData(response.data);
            } catch (error) {
                console.error('Error insight data:', error);
                setError(error.message || "Unable to load your EV insights.");
            } finally {
                setLoading(false);
            }
        };
        loadInsightData();
    }, []);

    // Set data for graphs
    const createGraphData = (yourValue, similarValue, allValue) => ({
        labels: ['You', 'Compared to Similar Drivers', 'Compared to All Drivers'],
        datasets: [
            {
                data: [yourValue, similarValue, allValue],
                backgroundColor: [
                    'rgba(179, 91, 55, 0.8)',
                    'rgba(11, 107, 70, 0.8)',
                    'rgba(250, 250, 250, 0.8)'
                ],
                borderColor: 'rgb(0, 0, 0)',
                borderWidth: 1,
            },
        ],
    });
    const graph1Data = createGraphData(
        data.fuel_efficiency,
        data.similarDriverAverages?.fuel_efficiency,
        data.allDriverAverages?.fuel_efficiency
    );
    const graph2Data = createGraphData(
        data.monthly_fuel_spend,
        data.similarDriverAverages?.monthly_fuel_spend,
        data.allDriverAverages?.monthly_fuel_spend
    );
    const graph3Data = createGraphData(
        data.weekly_km,
        data.similarDriverAverages?.weekly_km,
        data.allDriverAverages?.weekly_km
    );

    // Turn negative values into positive and provide correct direction (less than or more than)
    const comparisonMap = Object.fromEntries(
        Object.entries(data?.comparison || {}).map(([key, value]) => [
            key,
            {
            value: Math.abs(value),
            direction: value < 0 ? "less" : "more"
            }
        ])
    );

    if (loading) {
        return <p className="insights-status">Loading your personalised EV recommendation…</p>;
    }

    if (error) {
        return <p className="insights-status insights-status-error">{error}</p>;
    }

    return (
        <div>
            <div className="background-image"></div>
            <div className="center eighty-width">
                <SuitabilitySummary data={data} />
                <div className="container vertical auto-width">
                    <h4 className="text-center orange">COMPARE YOUR DRIVE</h4>
                    <h6 className="text-center">Similar Drivers & EV Benefits</h6>
                </div>
                <div className="container no-borderBckgrd horizontal auto-width">
                    <div className="container inner-left third-width">                       
                        <table className="onlyTable">
                            <caption className="text-xlarge orange">Your stats</caption>
                            <tbody>
                                <tr>
                                    <td>You drive</td>
                                    <td className="highlight text-xlarge">{data.weekly_km}km</td>
                                    <td>a week.</td>
                                </tr>
                                <tr>
                                    <td>You spend</td>
                                    <td className="highlight text-xlarge">${data.monthly_fuel_spend}</td>
                                    <td>a month.</td>
                                </tr>
                                <tr>
                                    <td>Your car uses</td>
                                    <td className="highlight text-xlarge">{data.fuel_efficiency}</td>
                                    <td>L/100km</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="container no-borderBckgrd vertical inner-right twoThird-width">
                        <div className="container vertical full-width">
                            <p className="text-xlarge text-center orange">Your profile type</p>
                            <p className="text-large text-center font-italic">{data.profileType}</p>
                            <p className="text-center">{data.description}</p>
                        </div>
                        <br></br>
                        <div className="container vertical full-width">
                            <Savings estimatedSave={data.estimatedSavings} savingsMessage={data.savingsMessage} />
                        </div>
                    </div>
                </div>
                <div className="container horizontal auto-width">
                    <div className="inner-right third-width">
                        <BarChart data={graph1Data} title={"Average Fuel Efficiency of Vehicle (L/100km)"} />
                        <p className="text-left">Your vehicle is{" "}
                            {comparisonMap.sim_fuel_efficiency_difference?.value} L/100km{" "}
                            {comparisonMap.sim_fuel_efficiency_difference?.direction} than similar drivers and{" "}
                            {comparisonMap.all_fuel_efficiency_difference?.value} L/100km{" "}
                            {comparisonMap.all_fuel_efficiency_difference?.direction} efficient than the overall driver average.</p>
                    </div>
                    <div className="center third-width">
                        <BarChart data={graph2Data} title={"Average Amount ($) Spent on Fuel Monthly"} />
                        <p className="text-center">On Average, you spend $
                            {comparisonMap.sim_monthly_fuel_spend_difference?.value}{" "}
                            {comparisonMap.sim_monthly_fuel_spend_difference?.direction} per month on fuel than similar drivers and $
                            {comparisonMap.all_monthly_fuel_spend_difference?.value}{" "}
                            {comparisonMap.all_monthly_fuel_spend_difference?.direction} than the overall driver average.</p>
                    </div>
                    <div className="inner-left third-width">
                        <BarChart data={graph3Data} title={"Average Weekly KMs driven"} />
                        <p className="text-center">On Average, you drive{" "}
                            {comparisonMap.sim_weekly_km_difference?.value}km{" "}
                            {comparisonMap.sim_weekly_km_difference?.direction} per week than similar drivers and{" "}
                            {comparisonMap.all_weekly_km_difference?.value}km{" "}
                            {comparisonMap.all_weekly_km_difference?.direction} than the overall driver average.</p>
                    </div>
                </div>
                <br></br>
                <div className="full-width centerBtn">
                    <button onClick={() => navigate('/insights-form')} className="btn btn-primary">Back to form</button>
                    <button onClick={() => navigate('/profile')} className="btn btn-primary">Back to Dashboard</button>
                </div>
            </div>
        </div>
    );
}

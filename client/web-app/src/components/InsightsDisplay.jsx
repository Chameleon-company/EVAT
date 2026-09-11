import React, { useState, useEffect } from "react";
import BarChart from "./BarChart";
import { getMyInsights } from "../services/personalisedEvInsightsService";
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';
import { UserRound, ChartNoAxesColumn, TrendingUp } from 'lucide-react';


function Savings({estimatedSave}) {
    if (estimatedSave != 0) {
        return (
            <div>
                <p className="mb-4 text-xl font-bold text-slate-900">Your potential EV savings</p>
                <p className="text-sm leading-6 text-slate-500">Based on your responses, you could save around</p>
                <p className="my-3 text-4xl font-bold tracking-tight text-emerald-600">${estimatedSave}</p>
                <p className="text-sm leading-6 text-slate-500">per month on fuel alone.</p>
            </div>
        )
    }
    else {
        return (
            <div>
                <p className="mb-4 text-xl font-bold text-slate-900">Your potential EV savings</p>
                <p className="text-sm leading-6 text-slate-500">Based on your responses, you already own an EV</p>
                <p className="text-sm leading-6 text-slate-500">savings do not apply.</p>
            </div>
        )
    }
}

export default function InsightsDisplay() {
    const navigate = useNavigate();
    const tokenFull = localStorage.getItem("currentUser");
    const token = tokenFull ? JSON.parse(tokenFull).token : null;

    const [data, setData] = useState({});

    // Get the data from the backend
    useEffect(() => {
        const loadInsightData = async () => {
            try {
                const response = await getMyInsights(token);
                setData(response.data);
                console.log(response.data);
            } catch (error) {
                console.error('Error insight data:', error);
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
                    'rgba(148, 163, 184, 0.8)'
                ],
                borderColor: 'rgb(203, 213, 225)',
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

    return (
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
            <header className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Compare Your Drive</h1>
                <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">Similar Drivers &amp; EV Benefits</p>
            </header>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_6px_25px_rgba(15,23,42,0.06)] sm:p-6">
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><UserRound className="h-5 w-5" aria-hidden="true" /></span>
                        <h2 className="text-xl font-bold text-slate-900">Your profile type</h2>
                        <span className="max-w-full rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 md:ml-auto">{data.profileType}</span>
                    </div>
                    <p className="text-sm leading-6 text-slate-500">{data.description}</p>
                </section>
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_6px_25px_rgba(15,23,42,0.06)] sm:p-6">
                    <Savings estimatedSave={data.estimatedSavings} />
                </section>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_6px_25px_rgba(15,23,42,0.06)] sm:p-6 mt-5" aria-labelledby="insights-stats">
                <h2 id="insights-stats" className="mb-5 flex items-center gap-3 text-xl font-bold text-slate-900"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><ChartNoAxesColumn className="h-5 w-5" aria-hidden="true" /></span>Your stats</h2>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <dt className="text-sm font-medium text-slate-500">Fuel Efficiency (L/100km)</dt>
                        <dd className="mt-2 text-2xl font-semibold text-slate-900">{data.fuel_efficiency}</dd>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <dt className="text-sm font-medium text-slate-500">Monthly Fuel Spend ($)</dt>
                        <dd className="mt-2 text-2xl font-semibold text-slate-900">${data.monthly_fuel_spend}</dd>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <dt className="text-sm font-medium text-slate-500">Weekly Distance (km)</dt>
                        <dd className="mt-2 text-2xl font-semibold text-slate-900">{data.weekly_km}</dd>
                    </div>
                </dl>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_6px_25px_rgba(15,23,42,0.06)] sm:p-6 mt-5" aria-labelledby="insights-comparisons">
                <h2 id="insights-comparisons" className="mb-5 flex items-center gap-3 text-xl font-bold text-slate-900"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><TrendingUp className="h-5 w-5" aria-hidden="true" /></span>Detailed Comparisons</h2>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="min-w-0 rounded-xl border border-slate-200 p-4">
                        <BarChart data={graph1Data} title={"Average Fuel Efficiency of Vehicle (L/100km)"} />
                        <p className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">Your vehicle is{" "}
                            {comparisonMap.sim_fuel_efficiency_difference?.value} L/100km{" "}
                            {comparisonMap.sim_fuel_efficiency_difference?.direction} than similar drivers and{" "}
                            {comparisonMap.all_fuel_efficiency_difference?.value} L/100km{" "}
                            {comparisonMap.all_fuel_efficiency_difference?.direction} efficient than the overall driver average.</p>
                    </div>
                    <div className="min-w-0 rounded-xl border border-slate-200 p-4">
                        <BarChart data={graph2Data} title={"Average Amount ($) Spent on Fuel Monthly"} />
                        <p className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">On Average, you spend $
                            {comparisonMap.sim_monthly_fuel_spend_difference?.value}{" "}
                            {comparisonMap.sim_monthly_fuel_spend_difference?.direction} per month on fuel than similar drivers and $
                            {comparisonMap.all_monthly_fuel_spend_difference?.value}{" "}
                            {comparisonMap.all_monthly_fuel_spend_difference?.direction} than the overall driver average.</p>
                    </div>
                    <div className="min-w-0 rounded-xl border border-slate-200 p-4">
                        <BarChart data={graph3Data} title={"Average Weekly KMs driven"} />
                        <p className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">On Average, you drive{" "}
                            {comparisonMap.sim_weekly_km_difference?.value}km{" "}
                            {comparisonMap.sim_weekly_km_difference?.direction} per week than similar drivers and{" "}
                            {comparisonMap.all_weekly_km_difference?.value}km{" "}
                            {comparisonMap.all_weekly_km_difference?.direction} than the overall driver average.</p>
                    </div>
                </div>
            </section>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
                <Button type="button" variant="transparent" className="w-full sm:w-auto" onClick={() => navigate('/insights-form')}>Back to form</Button>
                <Button type="button" className="w-full sm:w-auto" onClick={() => navigate('/profile')}>Back to Dashboard</Button>
            </div>
        </main>
    );
}

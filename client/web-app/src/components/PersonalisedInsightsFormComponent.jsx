import React, { useState } from "react";
import { submitInsights } from "../services/personalisedEvInsightsService";
import { useNavigate } from 'react-router-dom';
import { Car, Fuel, Leaf } from 'lucide-react';

export default function PersonalisedInsightsFormComponent() {
  const navigate = useNavigate();
  const tokenFull = localStorage.getItem("currentUser");
  const token = tokenFull ? JSON.parse(tokenFull).token : null;

  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    weekly_km: "",
    trip_length: "",
    driving_frequency: "",
    driving_type: "",
    road_trips: "",
    car_ownership: "",
    fuel_efficiency: "",
    monthly_fuel_spend: "",
    home_charging: "",
    solar_panels: "",
    charging_preference: "",
    budget: "",
    priorities: "",
    postcode: ""
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Updates when values are entered into the form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // True or false states of the checkboxes
  const [inputs, setInputs] = useState({
    affordability: false,
    driving_range: false,
    environmental_impact: false,
    charging_convenience: false,
    tech_features: false,
    brand_design: false,
  });

  // Handles change for checkboxes
  const handleCheckChange = (e) => {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    setInputs(values => ({...values, [name]: value}))
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Creates list based off ticked checkboxes
    const priorities = [];
    if (inputs.affordability) {priorities.push("Affordability")}
    if (inputs.driving_range) {priorities.push("Driving range")}
    if (inputs.environmental_impact) {priorities.push("Environmental impact")}
    if (inputs.charging_convenience) {priorities.push("Charging convenience")}
    if (inputs.tech_features) {priorities.push("Tech features")}
    if (inputs.brand_design) {priorities.push("Brand/ design")}
    formData.priorities = priorities.join(", ")
    console.log(formData.priorities);

    const payload = {
      weekly_km: formData.weekly_km,
      trip_length: formData.trip_length,
      driving_frequency: formData.driving_frequency,
      driving_type: formData.driving_type,
      road_trips: formData.road_trips,
      car_ownership: formData.car_ownership,
      fuel_efficiency: formData.fuel_efficiency,
      monthly_fuel_spend: formData.monthly_fuel_spend,
      home_charging: formData.home_charging,
      solar_panels: formData.solar_panels,
      charging_preference: formData.charging_preference,
      budget: formData.budget,
      priorities: formData.priorities,
      postcode: formData.postcode,
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await submitInsights(payload, token);
      console.log(response);

      setMessage("Form submitted successfully.");

      setFormData({
        weekly_km: "",
        trip_length: "",
        driving_frequency: "",
        driving_type: "",
        road_trips: "",
        car_ownership: "",
        fuel_efficiency: "",
        monthly_fuel_spend: "",
        home_charging: "",
        solar_panels: "",
        charging_preference: "",
        budget: "",
        priorities: "",
        postcode: ""
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Submission error:", error);
      setMessage("Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header className="mb-6 text-center sm:mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Personalised EV Usage Insights</h1>
        <p className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
          Fill in your details to receive personalised EV insights based on your
          driving behaviour.
        </p>

      </header>
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_6px_25px_rgba(15,23,42,0.06)] sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          <section className="min-w-0 space-y-4" aria-label="Driving Details">
            <h2 className="mb-5 flex items-center gap-3 text-xl font-bold text-slate-900"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Car className="h-5 w-5" aria-hidden="true" /></span>Driving Details</h2>

            <div className="grid items-center gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4">
              <label htmlFor="insights-weekly_km" className="text-sm font-semibold text-slate-700">Weekly KM <span aria-hidden="true" className="text-red-500">*</span></label>
              <input
                type="number"
                id="insights-weekly_km"
                className="w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors hover:border-emerald-300 hover:bg-white focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                name="weekly_km"
                placeholder="e.g. 250"
                value={formData.weekly_km}
                onChange={handleChange}
              />
            </div>

            <div className="grid items-center gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4">
              <label htmlFor="insights-trip_length" className="text-sm font-semibold text-slate-700">Typical Trip Length <span aria-hidden="true" className="text-red-500">*</span></label>
              <select
                id="insights-trip_length"
                className="w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors hover:border-emerald-300 hover:bg-white focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                name="trip_length"
                value={formData.trip_length}
                onChange={handleChange}
              >
                <option value="">Select trip length</option>
                <option value="Mostly short trips (<10 km)">Short</option>
                <option value="Mostly medium trips (10-50 km)">Medium</option>
                <option value="Mostly long trips (>50 km)">Long</option>
              </select>
            </div>

            <div className="grid items-center gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4">
              <label htmlFor="insights-driving_frequency" className="text-sm font-semibold text-slate-700">Driving Frequency <span aria-hidden="true" className="text-red-500">*</span></label>
              <select
                id="insights-driving_frequency"
                className="w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors hover:border-emerald-300 hover:bg-white focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                name="driving_frequency"
                value={formData.driving_frequency}
                onChange={handleChange}
              >
                <option value="">Select driving frequency</option>
                <option value="Daily">Daily</option>
                <option value="A few times a week">Few times a week</option>
                <option value="Weekly">Weekly</option>
                <option value="Occasionally">Occasionally</option>
              </select>
            </div>

            <div className="grid items-center gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4">
              <label htmlFor="insights-driving_type" className="text-sm font-semibold text-slate-700">Driving Type <span aria-hidden="true" className="text-red-500">*</span></label>
              <select
                id="insights-driving_type"
                className="w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors hover:border-emerald-300 hover:bg-white focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                name="driving_type"
                value={formData.driving_type}
                onChange={handleChange}
              >
                <option value="">Select driving type</option>
                <option value="Mostly inner-city or suburban driving (short distances/stop-start traffic)">Inner-city or suburban</option>
                <option value="Mostly highway or regional driving (longer distances/higher speeds)">Highways or regional</option>
                <option value="A mix of city/suburban and highway driving">Suburban and highways</option>
                <option value="Mostly rural or remote area driving (long distances/variable road conditions)">Rural or remote</option>
              </select>
            </div>

            <div className="grid items-center gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4">
              <label htmlFor="insights-road_trips" className="text-sm font-semibold text-slate-700">Do you regularly go on long road trips? <span aria-hidden="true" className="text-red-500">*</span></label>
              <select
                id="insights-road_trips"
                className="w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors hover:border-emerald-300 hover:bg-white focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                name="road_trips"
                value={formData.road_trips}
                onChange={handleChange}
              >
                <option value="">Select option</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="grid items-center gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4">
              <label htmlFor="insights-car_ownership" className="text-sm font-semibold text-slate-700">Do you own a vehicle <span aria-hidden="true" className="text-red-500">*</span></label>
              <select
                id="insights-car_ownership"
                className="w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors hover:border-emerald-300 hover:bg-white focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                name="car_ownership"
                value={formData.car_ownership}
                onChange={handleChange}
              >
                <option value="">Select ownership</option>
                <option value="Yes - Petrol">Petrol</option>
                <option value="Yes - Diesel">Diesel</option>
                <option value="Yes - Hybrid">Hybrid</option>
                <option value="Yes - Electric">Electric</option>
                <option value="No - I don't own a car">No car</option>
              </select>
            </div>
          </section>

          <section className="min-w-0 space-y-4 border-t border-slate-200 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0" aria-label="Fuel and Charging">
            <h2 className="mb-5 flex items-center gap-3 text-xl font-bold text-slate-900"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Fuel className="h-5 w-5" aria-hidden="true" /></span>Fuel and Charging</h2>

            <div className="grid items-center gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4">
              <label htmlFor="insights-fuel_efficiency" className="text-sm font-semibold text-slate-700">Fuel Efficiency (L/100km) <span aria-hidden="true" className="text-red-500">*</span></label>
              <input
                type="number"
                id="insights-fuel_efficiency"
                className="w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors hover:border-emerald-300 hover:bg-white focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                name="fuel_efficiency"
                placeholder="e.g. 7.5"
                value={formData.fuel_efficiency}
                onChange={handleChange}
              />
            </div>

            <div className="grid items-center gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4">
              <label htmlFor="insights-monthly_fuel_spend" className="text-sm font-semibold text-slate-700">Monthly Fuel Spend ($) <span aria-hidden="true" className="text-red-500">*</span></label>
              <input
                type="number"
                id="insights-monthly_fuel_spend"
                className="w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors hover:border-emerald-300 hover:bg-white focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                name="monthly_fuel_spend"
                placeholder="e.g. 300"
                value={formData.monthly_fuel_spend}
                onChange={handleChange}
              />
            </div>

            <div className="grid items-center gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4">
              <label htmlFor="insights-home_charging" className="text-sm font-semibold text-slate-700">Is Home Charging Accessible <span aria-hidden="true" className="text-red-500">*</span></label>
              <select
                id="insights-home_charging"
                className="w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors hover:border-emerald-300 hover:bg-white focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                name="home_charging"
                value={formData.home_charging}
                onChange={handleChange}
              >
                <option value="">Select option</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Not sure">Not sure</option>
              </select>
            </div>

            <div className="grid items-center gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4">
              <label htmlFor="insights-solar_panels" className="text-sm font-semibold text-slate-700">Does Your Home Have Solar Panels <span aria-hidden="true" className="text-red-500">*</span></label>
              <select
                id="insights-solar_panels"
                className="w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors hover:border-emerald-300 hover:bg-white focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                name="solar_panels"
                value={formData.solar_panels}
                onChange={handleChange}
              >
                <option value="">Select option</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="grid items-center gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4">
              <label htmlFor="insights-charging_preference" className="text-sm font-semibold text-slate-700">Charging Location Preference <span aria-hidden="true" className="text-red-500">*</span></label>
              <select
                id="insights-charging_preference"
                className="w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors hover:border-emerald-300 hover:bg-white focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                name="charging_preference"
                value={formData.charging_preference}
                onChange={handleChange}
              >
                <option value="">Select preference</option>
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="Public stations">Public charging</option>
                <option value="No Preference">No Preference</option>
              </select>
            </div>

          </section>
        </div>

        <section className="mt-6 space-y-4 border-t border-slate-200 pt-6" aria-label="EV Preference">
          <h2 className="mb-5 flex items-center gap-3 text-xl font-bold text-slate-900"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Leaf className="h-5 w-5" aria-hidden="true" /></span>EV Preference</h2>

          <div className="grid items-center gap-2 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4">
            <label htmlFor="insights-budget" className="text-sm font-semibold text-slate-700">Budget <span aria-hidden="true" className="text-red-500">*</span></label>
            <select
              id="insights-budget"
              className="w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors hover:border-emerald-300 hover:bg-white focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 sm:max-w-sm"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
            >
              <option value="">Select budget</option>
              <option value="<$40,000">Under $40k</option>
              <option value="$40,000-$60,000">$40k - $60k</option>
              <option value="$60,000-$80,000">$60k - $80k</option>
              <option value=">$80,000">Over 80k$</option>
              <option value="Not sure/ Just exploring">Not sure / Just exploring</option>
            </select>
          </div>

          <div className="grid items-center gap-2 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4">
            <span id="insights-priorities-label" className="text-sm font-semibold text-slate-700">Priorities <span aria-hidden="true" className="text-red-500">*</span></span>
            <div role="group" aria-labelledby="insights-priorities-label" className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <label htmlFor="priorities1" className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 text-sm text-slate-700 transition-colors focus-within:ring-4 focus-within:ring-emerald-500/10 ${inputs.affordability ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50"}`}>
                <input
                  className="h-4 w-4 shrink-0 accent-emerald-600"
                  name="affordability"
                  type="checkbox"
                  id="priorities1"
                  value="Affordability"
                  checked={inputs.affordability}
                  onChange={handleCheckChange} />
                <span>Affordability</span>
              </label>
              <label htmlFor="priorities2" className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 text-sm text-slate-700 transition-colors focus-within:ring-4 focus-within:ring-emerald-500/10 ${inputs.driving_range ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50"}`}>
                <input
                  className="h-4 w-4 shrink-0 accent-emerald-600"
                  name="driving_range"
                  type="checkbox"
                  id="priorities2"
                  value="Driving range"
                  checked={inputs.driving_range}
                  onChange={handleCheckChange} />
                <span>Driving range</span>
              </label>
              <label htmlFor="priorities3" className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 text-sm text-slate-700 transition-colors focus-within:ring-4 focus-within:ring-emerald-500/10 ${inputs.environmental_impact ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50"}`}>
                <input
                  className="h-4 w-4 shrink-0 accent-emerald-600"
                  name="environmental_impact"
                  type="checkbox"
                  id="priorities3"
                  value="Environmental impact"
                  checked={inputs.environmental_impact}
                  onChange={handleCheckChange} />
                <span>Environmental Impact</span>
              </label>
              <label htmlFor="priorities4" className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 text-sm text-slate-700 transition-colors focus-within:ring-4 focus-within:ring-emerald-500/10 ${inputs.charging_convenience ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50"}`}>
                <input
                  className="h-4 w-4 shrink-0 accent-emerald-600"
                  name="charging_convenience"
                  type="checkbox" id="priorities4"
                  value="Charging convenience"
                  checked={inputs.charging_convenience}
                  onChange={handleCheckChange} />
                <span>Charging Convenience</span>
              </label>
              <label htmlFor="priorities5" className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 text-sm text-slate-700 transition-colors focus-within:ring-4 focus-within:ring-emerald-500/10 ${inputs.tech_features ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50"}`}>
                <input
                  className="h-4 w-4 shrink-0 accent-emerald-600"
                  name="tech_features"
                  type="checkbox"
                  id="priorities5"
                  value="Tech features"
                  checked={inputs.tech_features}
                  onChange={handleCheckChange} />
                <span>Tech Features</span>
              </label>
              <label htmlFor="priorities6" className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 text-sm text-slate-700 transition-colors focus-within:ring-4 focus-within:ring-emerald-500/10 ${inputs.brand_design ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50"}`}>
                <input
                  className="h-4 w-4 shrink-0 accent-emerald-600"
                  name="brand_design"
                  type="checkbox"
                  id="priorities6"
                  value="Brand/ design"
                  checked={inputs.brand_design}
                  onChange={handleCheckChange} />
                <span>Brand/Design</span>
              </label>
            </div>
          </div>

          <div className="grid items-center gap-2 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4">
            <label htmlFor="insights-postcode" className="text-sm font-semibold text-slate-700">Postcode <span aria-hidden="true" className="text-red-500">*</span></label>
            <input
              type="text"
              id="insights-postcode"
              className="w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors hover:border-emerald-300 hover:bg-white focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 sm:max-w-sm"
              name="postcode"
              placeholder="Enter postcode"
              value={formData.postcode}
              onChange={handleChange}
            />
          </div>
        </section>

        <div className="mt-6 flex justify-end">
          {!submitted ?
            <button type="submit" className="w-full rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-44" disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </button>
            :
            <button className="w-full rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-44" onClick={() => navigate('/insights')}>View EV Insights</button>
          }
        </div>

        {message && <p role="status" className={`mt-4 rounded-lg border px-4 py-3 text-sm ${message === "Form submitted successfully." ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{message}</p>}
      </form>
    </main>
  );
}

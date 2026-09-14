import React from "react";
import FeedbackForm from "../components/FeedbackForm";
import NavBar from "../components/NavBar";

function Feedback() {
  return (
    <div
      className="
        relative min-h-screen overflow-hidden
        bg-slate-50 text-slate-900
        transition-colors duration-300
        dark:bg-transparent dark:text-white
      "
    >
      <NavBar />

      <div
        className="
          pointer-events-none fixed inset-0 -z-0
          bg-gradient-to-br
          from-slate-50
          via-white
          to-emerald-50/60
          dark:bg-none
        "
      />

      <div
        className="
          pointer-events-none fixed
          left-1/2 top-[10%] -z-0
          h-[500px] w-[700px]
          -translate-x-1/2
          rounded-full
          bg-emerald-100/40
          blur-3xl
          dark:bg-emerald-950/20
        "
      />

      <div
        className="
          pointer-events-none fixed
          -bottom-32 -left-32 -z-0
          h-[400px] w-[400px]
          rounded-full
          bg-emerald-100/20
          blur-3xl
          dark:bg-emerald-900/10
        "
      />

      <main className="relative z-10">
        <FeedbackForm />
      </main>
    </div>
  );
}

export default Feedback;
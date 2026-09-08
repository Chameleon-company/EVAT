import { useState, useEffect } from "react";

import { Mail, User } from "lucide-react";
import ErrorMessage from "../components/ErrorMessage";
import SuccessMessage from "../components/SuccessMessage";

const API_URL = import.meta.env.VITE_API_URL;
const SUPPORT_ENDPOINT = `${API_URL}/support-requests`;
const RECENT_SUCCESS_MESSAGE_LINGER = 5000;

export default function SupportRequestForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [issue, setIssue] = useState("");
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isNameEmpty, setIsNameEmpty] = useState(false);
  const [isEmailEmpty, setIsEmailEmpty] = useState(false);
  const [isIssueEmpty, setIsIssueEmpty] = useState(false);
  const [isDescriptionEmpty, setIsDescriptionEmpty] = useState(false);
  const [recentSuccess, setRecentSuccess] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("currentUser");
    if (!raw) return;

    try {
      const u = JSON.parse(raw);
      const name = [u?.firstName, u?.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

      setName(name);
      setEmail(u?.email);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (recentSuccess) {
      const timer = setTimeout(() => {
        setRecentSuccess(false);
        setSuccess(false);
      }, RECENT_SUCCESS_MESSAGE_LINGER);

      return () => clearTimeout(timer);
    }
  }, [recentSuccess]);

  const handleValidation = (e) => {
    e.preventDefault();

    const isNameEmpty = name.trim() === "";
    const isEmailEmpty = email.trim() === "";
    const isIssueEmpty = issue.trim() === "";
    const isDescriptionEmpty = description.trim() === "";

    setIsNameEmpty(isNameEmpty);
    setIsEmailEmpty(isEmailEmpty);
    setIsIssueEmpty(isIssueEmpty);
    setIsDescriptionEmpty(isDescriptionEmpty);
    setError(null);

    if (
      !isNameEmpty &&
      !isEmailEmpty &&
      !isIssueEmpty &&
      !isDescriptionEmpty
    ) {
      handleSubmit(e);
    }
  };

  const getUserId = () => {
    const raw = localStorage.getItem("currentUser");

    if (!raw) return null;

    try {
      const u = JSON.parse(raw);
      return u?.id || u?._id || null;
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (submitting) return;

    const userId = getUserId();

    if (!userId) {
      setError("Please sign in first.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(SUPPORT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(userId),
        },
        body: JSON.stringify({
          name: name,
          email: email,
          issue: issue,
          description: description,
        }),
      });

      let data;

      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Submit failed (${res.status})`
        );
      }

      const prev = JSON.parse(
        localStorage.getItem("supportRequests") || "[]"
      );

      localStorage.setItem(
        "supportRequests",
        JSON.stringify([...prev, data])
      );

      setSuccess(
        `Support request submitted! ${
          data.reference ? `Reference: ${data.reference}` : ""
        }`
      );

      setRecentSuccess(true);

      setName(name);
      setEmail(email);
      setIssue("");
      setDescription("");
    } catch (err) {
      setError("Unable to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const labelClass = `
    mb-2 block text-sm font-semibold
    text-slate-700
    dark:text-gray-200
    after:ml-1 after:text-red-500
    after:content-['*']
  `;

  const inputClass = `
    peer w-full rounded-lg border
    border-slate-200 bg-slate-50
    py-3 pl-10 pr-3
    text-slate-900
    placeholder:text-slate-400
    transition-all duration-200
    hover:border-emerald-300
    hover:bg-white
    focus:border-emerald-500
    focus:bg-white
    focus:outline-none
    focus:ring-4
    focus:ring-emerald-500/10

    dark:border-gray-800
    dark:bg-[#08100c]
    dark:text-gray-100
    dark:placeholder:text-gray-600
    dark:hover:border-emerald-900
    dark:hover:bg-[#0b1510]
    dark:focus:border-emerald-500
    dark:focus:bg-[#0b1510]
    dark:focus:ring-emerald-500/10
  `;

  return (
    <div
      className="
        mx-auto flex w-full max-w-2xl flex-col items-center
        px-4 py-8 text-slate-900
        dark:text-white
      "
    >
      <div className="mb-8 text-center">
        <span
          className="
            inline-flex items-center rounded-full
            border border-emerald-200 bg-emerald-50
            px-3.5 py-1.5 text-[11px] font-semibold
            uppercase tracking-[0.18em] text-emerald-700

            dark:border-emerald-900/70
            dark:bg-emerald-950/50
            dark:text-emerald-400
          "
        >
          Support Centre
        </span>

        <h2
          className="
            mt-4 text-center text-3xl font-bold
            tracking-tight text-slate-900
            dark:text-white
          "
        >
          Submit a Request
        </h2>

        <p
          className="
            mx-auto mt-2 max-w-md text-sm leading-6
            text-slate-500
            dark:text-gray-400
          "
        >
          Tell us what went wrong and our support team can help.
        </p>
      </div>

      <form
        onSubmit={handleValidation}
        className="
          relative flex w-full max-w-xl flex-col gap-4
          overflow-hidden rounded-2xl border
          border-slate-200
          bg-white/90
          p-6
          shadow-[0_8px_30px_rgba(15,23,42,0.08)]
          backdrop-blur-xl
          transition-all duration-300
          hover:border-emerald-200
          hover:shadow-[0_12px_35px_rgba(16,185,129,0.12)]
          sm:p-8

          dark:border-emerald-900/50
          dark:bg-[#050806]/90
          dark:shadow-[0_15px_45px_rgba(0,0,0,0.45)]
          dark:hover:border-emerald-800
          dark:hover:shadow-[0_15px_45px_rgba(16,185,129,0.08)]
        "
      >
        <div
          className="
            pointer-events-none absolute left-8 right-8 top-0
            h-px bg-gradient-to-r
            from-transparent via-emerald-300 to-transparent
            dark:via-emerald-700
          "
        />

        {error && <ErrorMessage error={error} />}
        {success && <SuccessMessage message={success} />}

        <div className="h-2" />

        <label className={labelClass}>
          Name
        </label>

        <div className="relative flex items-center">
          <User
            className="
              absolute left-3 h-5 w-5
              text-slate-400
              transition-colors duration-200
              peer-focus:text-emerald-600
              dark:text-gray-500
              dark:peer-focus:text-emerald-400
            "
          />

          <input
            className={inputClass}
            type="text"
            name="name"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="h-2" />

        {isNameEmpty && <ErrorMessage error="required" />}

        <label className={labelClass}>
          Email
        </label>

        <div className="relative flex items-center">
          <Mail
            className="
              absolute left-3 h-5 w-5
              text-slate-400
              transition-colors duration-200
              peer-focus:text-emerald-600
              dark:text-gray-500
              dark:peer-focus:text-emerald-400
            "
          />

          <input
            className={inputClass}
            type="email"
            name="email"
            placeholder="Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}"
          />
        </div>

        <div className="h-2" />

        {isEmailEmpty && <ErrorMessage error="required" />}

        <label className={labelClass}>
          Issue Type
        </label>

        <select
          className="
            w-full cursor-pointer rounded-lg border
            border-slate-200 bg-slate-50
            px-3 py-3
            text-slate-900
            transition-all duration-200
            hover:border-emerald-300
            hover:bg-white
            focus:border-emerald-500
            focus:bg-white
            focus:outline-none
            focus:ring-4 focus:ring-emerald-500/10

            dark:border-gray-800
            dark:bg-[#08100c]
            dark:text-gray-100
            dark:hover:border-emerald-900
            dark:hover:bg-[#0b1510]
            dark:focus:border-emerald-500
            dark:focus:bg-[#0b1510]
            dark:focus:ring-emerald-500/10
          "
          name="issue"
          value={issue}
          onChange={(e) => setIssue(e.target.value)}
        >
          <option value="">Select Issue Type</option>
          <option value="station">Can't Find a Station</option>
          <option value="payment">Payment Issue</option>
          <option value="info">Incorrect Station Info</option>
          <option value="other">Other</option>
        </select>

        <div className="h-2" />

        {isIssueEmpty && <ErrorMessage error="required" />}

        <label className={labelClass}>
          Description of Issue
        </label>

        <textarea
          className="
            min-h-28 w-full resize-y rounded-lg border
            border-slate-200 bg-slate-50
            px-3 py-3
            text-slate-900
            placeholder:text-slate-400
            transition-all duration-200
            hover:border-emerald-300
            hover:bg-white
            focus:border-emerald-500
            focus:bg-white
            focus:outline-none
            focus:ring-4 focus:ring-emerald-500/10

            dark:border-gray-800
            dark:bg-[#08100c]
            dark:text-gray-100
            dark:placeholder:text-gray-600
            dark:hover:border-emerald-900
            dark:hover:bg-[#0b1510]
            dark:focus:border-emerald-500
            dark:focus:bg-[#0b1510]
            dark:focus:ring-emerald-500/10
          "
          name="description"
          placeholder="Describe your issue..."
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="h-2" />

        {isDescriptionEmpty && <ErrorMessage error="required" />}

        <div className="h-2" />

        <button
          type="submit"
          className="
            mt-2 inline-flex w-full items-center
            justify-center rounded-lg
            bg-emerald-600
            px-5 py-3
            text-sm font-semibold text-white
            shadow-sm
            transition-all duration-200
            hover:-translate-y-0.5
            hover:bg-emerald-700
            hover:shadow-lg
            hover:shadow-emerald-500/20
            focus:outline-none
            focus:ring-4 focus:ring-emerald-500/20
            active:translate-y-0
            disabled:cursor-not-allowed
            disabled:opacity-60
            disabled:hover:translate-y-0

            dark:bg-emerald-600
            dark:shadow-[0_0_20px_rgba(16,185,129,0.10)]
            dark:hover:bg-emerald-500
            dark:hover:shadow-[0_0_25px_rgba(16,185,129,0.18)]
          "
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Request"}
        </button>

        <p
          className="
            mt-1 text-center text-xs
            text-slate-400
            dark:text-gray-600
          "
        >
          We’ll use the information provided to respond to your request.
        </p>
      </form>
    </div>
  );
}
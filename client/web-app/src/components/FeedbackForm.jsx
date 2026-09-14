import React, { useState, useEffect } from 'react';
import { Mail, User, Loader2 } from 'lucide-react';
import { submitFeedback } from '../services/feedbackService';
import ErrorMessage from '../components/ErrorMessage';
import SuccessMessage from '../components/SuccessMessage';

const RECENT_SUCCESS_MESSAGE_LINGER = 5000;

function FeedbackForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [suggestion, setSuggestion] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isNameEmpty, setIsNameEmpty] = useState(false);
  const [isEmailEmpty, setIsEmailEmpty] = useState(false);
  const [isSuggestionEmpty, setIsSuggestionEmpty] = useState(false);
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

    const isNameEmpty = name.trim() === '';
    const isEmailEmpty = email.trim() === '';
    const isSuggestionEmpty = suggestion.trim() === '';

    setIsNameEmpty(isNameEmpty);
    setIsEmailEmpty(isEmailEmpty);
    setIsSuggestionEmpty(isSuggestionEmpty);
    setError(null);

    if (!isNameEmpty && !isEmailEmpty && !isSuggestionEmpty) {
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await submitFeedback({
        name: name,
        email: email,
        suggestion: suggestion,
      });

      console.log('Feedback submitted successfully:', response);

      setSuccess("Feedback submitted!");
      setRecentSuccess(true);

      setName(name);
      setEmail(email);
      setSuggestion('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError('Unable to submit');
      setError(
        error.message || 'Failed to submit feedback. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
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
        px-4 py-8
        text-slate-900
        dark:text-white
      "
    >
      <div className="mb-8 text-center">
        <span
          className="
            inline-flex items-center rounded-full
            border border-emerald-200
            bg-emerald-50
            px-3.5 py-1.5
            text-[11px] font-semibold uppercase
            tracking-[0.18em]
            text-emerald-700

            dark:border-emerald-900/70
            dark:bg-emerald-950/50
            dark:text-emerald-400
          "
        >
          Your Voice Matters
        </span>

        <h2
          className="
            mt-4 text-center text-3xl font-bold
            tracking-tight text-slate-900
            dark:text-white
          "
        >
          Send Feedback
        </h2>

        <p
          className="
            mx-auto mt-2 max-w-md text-sm leading-6
            text-slate-500
            dark:text-gray-400
          "
        >
          Help us improve EVAT by sharing your suggestions and feedback.
        </p>
      </div>

      <form
        className="
          w-full max-w-xl
          rounded-2xl border
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
        onSubmit={handleValidation}
      >
        <div
          className="
            mb-6 h-px w-full
            bg-gradient-to-r
            from-transparent
            via-emerald-300
            to-transparent
            dark:via-emerald-800
          "
        />

        {error && <ErrorMessage error={error} />}
        {success && <SuccessMessage message={success} />}

        <div className="h-2" />

        <label className={labelClass} htmlFor="name">
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
            name="name"
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="h-2" />

        {isNameEmpty && <ErrorMessage error="required" />}

        <label className={labelClass} htmlFor="email">
          E-Mail
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
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}"
          />
        </div>

        <div className="h-2" />

        {isEmailEmpty && <ErrorMessage error="required" />}

        <label className={labelClass} htmlFor="suggestion">
          Suggestion
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
          "
          name="suggestion"
          placeholder="Enter your suggestion or feedback"
          rows="4"
          value={suggestion}
          onChange={(e) => setSuggestion(e.target.value)}
        />

        <div className="h-2" />

        {isSuggestionEmpty && <ErrorMessage error="required" />}

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
            focus:ring-4
            focus:ring-emerald-500/20
            active:translate-y-0
            disabled:cursor-not-allowed
            disabled:opacity-60
            disabled:hover:translate-y-0

            dark:bg-emerald-600
            dark:shadow-[0_0_20px_rgba(16,185,129,0.10)]
            dark:hover:bg-emerald-500
            dark:hover:shadow-[0_0_25px_rgba(16,185,129,0.18)]
          "
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit'
          )}
        </button>

        <p
          className="
            mt-4 text-center text-xs
            text-slate-400
            dark:text-gray-600
          "
        >
          Your feedback helps us make EVAT better.
        </p>
      </form>
    </div>
  );
}

export default FeedbackForm;
import React, { useState, useEffect } from 'react';
import { Mail, User, Loader2 } from 'lucide-react';
import { submitFeedback } from '../services/feedbackService';
import ErrorMessage from '../components/ErrorMessage'
import SuccessMessage from '../components/SuccessMessage'

const RECENT_SUCCESS_MESSAGE_LINGER = 5000; // 5 seconds * 1000

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

  // Prefill name/email from currentUser if available
  useEffect(() => {
    const raw = localStorage.getItem("currentUser");
    if (!raw) return;
    try {
      const u = JSON.parse(raw);
      const name = [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim();
      setName(name);
      setEmail(u?.email);

    } catch {/* ignore */}
  }, []);

  // auto-clear the warning after 5 seconds so it doesn't linger forever
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
    setError(null); // Clear previous errors

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
      // Clear success message after 5 seconds
      setSuccess("Feedback submitted!");
      setRecentSuccess(true);

      // Reset form
      setName(name);
      setEmail(email);
      setSuggestion('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError('Unable to submit');
      // setSubmitStatus('error');
      setError(error.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-8">
      <h2 className="mb-8 text-center text-3xl font-bold">Send Feedback</h2>
      
        <form className="flex w-full max-w-xl flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.08)] transition-all duration-300 hover:border-emerald-200 hover:shadow-[0_12px_35px_rgba(16,185,129,0.12)] sm:p-8"
              onSubmit={handleValidation}>
          {/* Submit Error and Success Messages */}
          {error && <ErrorMessage error={error}/>}
          {success && <SuccessMessage message={success}/>}
          <div className="h-2" />

          {/* Enter Name */}
          <label className="mb-2 block text-sm font-semibold text-slate-700 after:ml-1 after:text-red-500 after:content-['*']" htmlFor="name">Name</label>
          <div className="relative flex items-center">
            <User className="absolute left-3 h-5 w-5 text-slate-400 transition-colors duration-200 peer-focus:text-emerald-600" />
            <input
              className="peer w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-slate-900 placeholder:text-slate-400 transition-all duration-200 hover:border-emerald-300 hover:bg-white focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
              name="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="h-2"/> 
          {/* Name Error Message */}
          {isNameEmpty && <ErrorMessage error="Name is required."/>}

          {/* Enter Email */}
          <label className="mb-2 block text-sm font-semibold text-slate-700 after:ml-1 after:text-red-500 after:content-['*']" htmlFor="email">E-Mail</label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3 h-5 w-5 text-slate-400 transition-colors duration-200 peer-focus:text-emerald-600" />
            <input
              className="peer w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-slate-900 placeholder:text-slate-400 transition-all duration-200 hover:border-emerald-300 hover:bg-white focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}"
            />
          </div>
          <div className="h-2"/>  
          {/* Email Error Message */}
          {isEmailEmpty && <ErrorMessage error="Email is required."/>}

          {/* Enter Suggestion */}
          <label className="mb-2 block text-sm font-semibold text-slate-700 after:ml-1 after:text-red-500 after:content-['*']" htmlFor="suggestion">Suggestion</label>
          <textarea
            className="min-h-28 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-slate-900 placeholder:text-slate-400 transition-all duration-200 hover:border-emerald-300 hover:bg-white focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
            name="suggestion"
            placeholder="Enter your suggestion or feedback"
            rows="4"
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
          />
          <div className="h-2"/> 
          {/* Suggestion Error Message */}
          {isSuggestionEmpty && <ErrorMessage error="Suggestion is required."/>}

          <div className="h-2" />
          <button 
            type="submit" 
            className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/20 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
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
        </form>
      </div>
  );
}

export default FeedbackForm;

import React from 'react';
import {
  Eye,
  EyeOff,
  KeyRound,
  Send,
} from 'lucide-react';

// src/components/api-tester/ApiTesterForm.jsx

const ApiTesterForm = ({
  method,
  setMethod,
  endpoint,
  setEndpoint,
  body,
  setBody,
  token,
  setToken,
  showToken,
  setShowToken,
  loading,
  onSend,
}) => {
  const autoFillToken = () => {
    try {
      // Get user data from local storage
      const userData = localStorage.getItem('currentUser');

      if (!userData) {
        alert('No login session found. Please log in first.');
        return;
      }

      // Parse JSON
      const parsed = JSON.parse(userData);

      if (parsed.token) {
        setToken(parsed.token);
        alert('Current login token loaded!');
      } else {
        alert('No token found in session.');
      }
    } catch (error) {
      console.error('Failed to read token:', error);
      alert('Failed to read token from localStorage.');
    }
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      {/* =========================================================
          HEADER
      ========================================================= */}
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          API Tester
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Send requests to the EVAT API and inspect the response.
        </p>
      </div>


      {/* =========================================================
          HTTP METHOD
      ========================================================= */}
      <div className="mb-5">
        <label
          htmlFor="api-method"
          className="mb-2 block text-sm font-semibold text-slate-800"
        >
          Method
        </label>

        <select
          id="api-method"
          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>


      {/* =========================================================
          ENDPOINT
      ========================================================= */}
      <div className="mb-5">
        <label
          htmlFor="api-endpoint"
          className="mb-2 block text-sm font-semibold text-slate-800"
        >
          Endpoint
        </label>

        <input
          id="api-endpoint"
          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          type="text"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          placeholder="e.g. /vehicle"
        />
      </div>


      {/* =========================================================
          AUTHORIZATION TOKEN
      ========================================================= */}
      <div className="mb-5">

        <div className="mb-2 flex items-center gap-2">
          <KeyRound
            size={17}
            strokeWidth={1.8}
            className="text-emerald-600"
          />

          <label
            htmlFor="api-token"
            className="text-sm font-semibold text-slate-800"
          >
            Authorization Bearer Token
          </label>
        </div>

        <p className="mb-3 text-xs text-slate-500">
          Required for protected routes.
        </p>


        {/* Token input */}
        <div className="relative">
          <input
            id="api-token"
            className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2.5 pl-3 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            type={showToken ? 'text' : 'password'}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste JWT or use Auto-Fill Token"
            autoComplete="off"
          />

          {/* Show / hide token */}
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            aria-label={showToken ? 'Hide token' : 'Show token'}
            title={showToken ? 'Hide token' : 'Show token'}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
          >
            {showToken ? (
              <EyeOff size={18} strokeWidth={1.8} />
            ) : (
              <Eye size={18} strokeWidth={1.8} />
            )}
          </button>
        </div>


        {/* Token actions */}
        <div className="mt-3 flex flex-wrap gap-2">

          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            {showToken ? 'Hide Token' : 'Show Token'}
          </button>

          <button
            type="button"
            onClick={autoFillToken}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            Auto-Fill Token
          </button>

        </div>
      </div>


      {/* =========================================================
          JSON BODY
          Only displayed for POST and PUT
      ========================================================= */}
      {method !== 'GET' && method !== 'DELETE' && (
        <div className="mb-5">

          <label
            htmlFor="api-body"
            className="mb-2 block text-sm font-semibold text-slate-800"
          >
            JSON Body
          </label>

          <textarea
            id="api-body"
            className="min-h-40 w-full resize-y rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 font-mono text-sm text-slate-800 outline-none transition placeholder:font-sans placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Enter JSON body or click a Quick Endpoint"
          />

          <p className="mt-1.5 text-xs text-slate-400">
            Enter a valid JSON object for this request.
          </p>

        </div>
      )}


      {/* =========================================================
          SEND REQUEST
      ========================================================= */}
      <button
        type="button"
        onClick={onSend}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Sending...
          </>
        ) : (
          <>
            <Send size={17} strokeWidth={2} />
            Send Request
          </>
        )}
      </button>

    </div>
  );
};

export default ApiTesterForm;
import React from 'react';
import { Send } from 'lucide-react';

// src/components/api-tester/ApiTesterForm.jsx

const ApiTesterForm = ({
  method,
  setMethod,
  endpoint,
  setEndpoint,
  body,
  setBody,
  loading,
  onSend,
}) => {

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-emerald-900/50 dark:bg-[#050806] dark:shadow-[0_15px_40px_rgba(0,0,0,0.35)]">

      {/* =========================================================
          HEADER
      ========================================================= */}
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          API Tester
        </h2>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Send requests to the EVAT API and inspect the response.
        </p>
      </div>


      {/* =========================================================
          HTTP METHOD
      ========================================================= */}
      <div className="mb-5">
        <label
          htmlFor="api-method"
          className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200"
        >
          Method
        </label>

        <select
          id="api-method"
          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 dark:border-emerald-900/60 dark:bg-black dark:text-white dark:focus:border-emerald-500 dark:focus:bg-[#08100c] dark:focus:ring-emerald-500/20"
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
          className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200"
        >
          Endpoint
        </label>

        <input
          id="api-endpoint"
          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 dark:border-emerald-900/60 dark:bg-black dark:text-white dark:placeholder:text-slate-600 dark:focus:border-emerald-500 dark:focus:bg-[#08100c] dark:focus:ring-emerald-500/20"
          type="text"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          placeholder="e.g. /vehicle"
        />
      </div>



      {/* =========================================================
          JSON BODY
          Only displayed for POST and PUT
      ========================================================= */}
      {method !== 'GET' && method !== 'DELETE' && (
        <div className="mb-5">

          <label
            htmlFor="api-body"
            className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200"
          >
            JSON Body
          </label>

          <textarea
            id="api-body"
            className="min-h-40 w-full resize-y rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 font-mono text-sm text-slate-800 outline-none transition placeholder:font-sans placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 dark:border-emerald-900/60 dark:bg-black dark:text-white dark:placeholder:text-slate-600 dark:focus:border-emerald-500 dark:focus:bg-[#08100c] dark:focus:ring-emerald-500/20"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Enter JSON body or click a Quick Endpoint"
          />

          <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
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
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:focus:ring-emerald-500/30"
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
// src/components/api-tester/ApiTesterResponse.jsx

import { JsonView } from 'react-json-view-lite';

const ApiTesterResponse = ({ response, error }) => {
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/40">
        <div className="mb-1 text-sm font-bold text-red-700 dark:text-red-400">
          Request Error
        </div>

        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      </div>
    );
  }

  if (!response) {
    return null;
  }

  const isSuccess =
    response.status >= 200 &&
    response.status < 300;

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-emerald-900/60 dark:bg-[#050806] dark:shadow-emerald-950/20">

      <div className="mb-5 flex items-center justify-between gap-3">

        <div>
          <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Response
          </h3>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            API response received from the server.
          </p>
        </div>

        <div
          className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
            isSuccess
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
              : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400'
          }`}
        >
          {response.status} {response.statusText}
        </div>

      </div>

      <div className="mb-5 overflow-hidden rounded-lg border border-slate-200 dark:border-emerald-900/60">

        <details>
          <summary className="cursor-pointer bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:bg-emerald-950/30 dark:text-slate-200 dark:hover:bg-emerald-950/50">
            Headers
          </summary>

          <div className="border-t border-slate-200 bg-white p-4 dark:border-emerald-900/60 dark:bg-[#030504]">
            <pre className="max-h-64 overflow-auto rounded-lg bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-100 dark:bg-black">
              {JSON.stringify(response.headers, null, 2)}
            </pre>
          </div>
        </details>

      </div>

      <div>

        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Response Body
          </h4>

          <span className="text-xs text-slate-400 dark:text-slate-500">
            JSON
          </span>
        </div>

        <div className="overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-emerald-900/60 dark:bg-[#020403]">

          <JsonView
            data={response.parsedBody || response.body}
            shouldExpandNode={(level) => level < 2}
          />

        </div>

      </div>

    </div>
  );
};

export default ApiTesterResponse;
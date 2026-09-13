// src/components/api-tester/ApiTesterHistory.jsx

import { Clock3, Trash2, CheckCircle2, XCircle } from 'lucide-react';

const ApiTesterHistory = ({ history, onLoad, onClear }) => {
  if (history.length === 0) {
    return null;
  }

  const isSuccess = (status) => {
    return status >= 200 && status < 300;
  };

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-emerald-900/60 dark:bg-[#050806] dark:shadow-emerald-950/20">

      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-emerald-900/60">
        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-emerald-950/50">
            <Clock3
              size={19}
              className="text-slate-600 dark:text-emerald-400"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Recent Requests
              </h2>

              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-emerald-950/60 dark:text-emerald-300">
                {history.length}
              </span>
            </div>

            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Click a request to load it again
            </p>
          </div>

        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onClear();
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:border-red-300 hover:bg-red-100 hover:text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400 dark:hover:border-red-800 dark:hover:bg-red-950/70 dark:hover:text-red-300"
        >
          <Trash2 size={15} />
          Clear History
        </button>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-emerald-950/60">

        {history.map((item, idx) => {
          const success = isSuccess(item.status);

          return (
            <button
              type="button"
              key={idx}
              onClick={() => onLoad(item)}
              className="group flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-emerald-950/20"
            >

              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  success
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400'
                }`}
              >
                {success ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <XCircle size={18} />
                )}
              </div>

              <div className="min-w-0 flex-1">

                <div className="flex min-w-0 flex-wrap items-center gap-2">

                  <span
                    className={`rounded-md border px-2 py-1 text-[10px] font-bold tracking-wide ${
                      item.method?.toUpperCase() === 'GET'
                        ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-400'
                        : item.method?.toUpperCase() === 'POST'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-400'
                        : item.method?.toUpperCase() === 'PUT'
                        ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-400'
                        : item.method?.toUpperCase() === 'DELETE'
                        ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400'
                        : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
                    }`}
                  >
                    {item.method}
                  </span>

                  <span className="truncate font-mono text-sm font-semibold text-slate-800 transition group-hover:text-emerald-700 dark:text-slate-200 dark:group-hover:text-emerald-400">
                    {item.endpoint}
                  </span>

                </div>

                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{item.timestamp}</span>
                </div>

              </div>

              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                  success
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                }`}
              >
                {item.status}
              </span>

            </button>
          );
        })}

      </div>

    </section>
  );
};

export default ApiTesterHistory;
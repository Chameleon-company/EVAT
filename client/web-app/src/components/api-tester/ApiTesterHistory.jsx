// src/components/api-tester/ApiTesterHistory.jsx

import { Clock3, Trash2, CheckCircle2, XCircle } from 'lucide-react';

const ApiTesterHistory = ({ history, onLoad, onClear }) => {
  if (history.length === 0) {
    return null;
  }

  // Determine whether the request was successful
  const isSuccess = (status) => {
    return status >= 200 && status < 300;
  };

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* ======================================================
          History Header
      ====================================================== */}

      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
            <Clock3
              size={19}
              className="text-slate-600"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Recent Requests
              </h2>

              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                {history.length}
              </span>
            </div>

            <p className="mt-0.5 text-xs text-slate-500">
              Click a request to load it again
            </p>
          </div>

        </div>


        {/* ====================================================
            Clear History Button
        ==================================================== */}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onClear();
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:border-red-300 hover:bg-red-100 hover:text-red-700"
        >
          <Trash2 size={15} />
          Clear History
        </button>

      </div>


      {/* ======================================================
          History List
      ====================================================== */}

      <div className="divide-y divide-slate-100">

        {history.map((item, idx) => {
          const success = isSuccess(item.status);

          return (
            <button
              type="button"
              key={idx}
              onClick={() => onLoad(item)}
              className="group flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
            >

              {/* ==================================================
                  Status Icon
              ================================================== */}

              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  success
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {success ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <XCircle size={18} />
                )}
              </div>


              {/* ==================================================
                  Request Information
              ================================================== */}

              <div className="min-w-0 flex-1">

                <div className="flex min-w-0 flex-wrap items-center gap-2">

                  {/* HTTP Method */}

                  <span
                    className={`rounded-md border px-2 py-1 text-[10px] font-bold tracking-wide ${
                      item.method?.toUpperCase() === 'GET'
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : item.method?.toUpperCase() === 'POST'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : item.method?.toUpperCase() === 'PUT'
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : item.method?.toUpperCase() === 'DELETE'
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    {item.method}
                  </span>


                  {/* Endpoint */}

                  <span className="truncate font-mono text-sm font-semibold text-slate-800 transition group-hover:text-emerald-700">
                    {item.endpoint}
                  </span>

                </div>


                {/* Timestamp */}

                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">

                  <span>
                    {item.timestamp}
                  </span>

                </div>

              </div>


              {/* ==================================================
                  Status Code
              ================================================== */}

              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                  success
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700'
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
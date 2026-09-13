// src/pages/ApiTester.jsx

import { useState, useEffect } from 'react';

import NavBar from "../components/NavBar";
import ApiTesterHistory from "../components/api-tester/ApiTesterHistory";
import ApiTesterSidebar from "../components/api-tester/ApiTesterSidebar";
import ApiTesterResponse from "../components/api-tester/ApiTesterResponse";
import ApiTesterForm from "../components/api-tester/ApiTesterForm";

import '../styles/API.css';
import '../styles/Buttons.css';
import '../styles/Elements.css';
import '../styles/Fonts.css';
import '../styles/Forms.css';
import '../styles/NavBar.css';
import '../styles/Sidebar.css';
import '../styles/Tables.css';
import '../styles/Validation.css';

const ApiTester = () => {
  const [endpoint, setEndpoint] = useState('/vehicle');
  const [method, setMethod] = useState('GET');
  const [body, setBody] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [endpointSearch, setEndpointSearch] = useState('');
  const baseUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || {});
      if (user.token) {
        setToken(user.token);
      }
    } catch (e) {
      console.warn('Failed to auto-load token from currentUser');
    }
  }, []);

  const sendRequest = async () => {
    setError('');
    setResponse(null);
    setLoading(true);

    try {
      const url = endpoint.startsWith('http')
        ? endpoint
        : `${baseUrl.replace(/\/+$/, '')}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

      let jsonBody = undefined;

      if (method !== 'GET' && method !== 'DELETE' && body.trim()) {
        jsonBody = JSON.parse(body);
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token.trim() && {
            Authorization: `Bearer ${token.trim()}`,
          }),
        },
        body: jsonBody ? JSON.stringify(jsonBody) : undefined,
      });

      const contentType = res.headers.get('content-type') || '';
      let data;

      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();

        if (
          res.status === 200 &&
          typeof data === 'string' &&
          data.includes('<title>Stand-in EVAT Website')
        ) {
          setError(
            'Request did NOT reach the backend — Vite served the frontend with index.html.'
          );
          setResponse(null);
          setLoading(false);
          return;
        }
      }

      const responseObj = {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        body:
          typeof data === 'object'
            ? JSON.stringify(data, null, 2)
            : data,
        parsedBody: typeof data === 'object' ? data : null,
      };

      setResponse(responseObj);

      const historyEntry = {
        timestamp: new Date().toLocaleTimeString(),
        method,
        endpoint,
        body: body.trim() || null,
        status: res.status,
      };

      setHistory((prev) => [historyEntry, ...prev].slice(0, 15));
    } catch (err) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (item) => {
    setEndpoint(item.endpoint);
    setMethod(item.method);
    setBody(item.body || '');
    window.scrollTo(0, 0);
  };

  const clearHistory = () => setHistory([]);

  const handleEndpointClick = (item) => {
    setMethod(item.method);
    setEndpoint(
      item.endpoint.replace(/\{[^}]+\}/g, '123')
    );

    setBody('');

    if (
      item.body &&
      ['POST', 'PUT', 'PATCH'].includes(item.method)
    ) {
      setBody(item.body.trim());
    }
  };

  const isDev = import.meta.env.DEV;
  const forceShow =
    new URLSearchParams(window.location.search).get('devtools') === '1';

  if (!isDev && !forceShow) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-black">
        <NavBar />

        <div className="flex min-h-[calc(100vh-var(--header-height))] items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50">
              <span className="text-2xl">🔒</span>
            </div>

            <h4 className="text-xl font-bold text-slate-900 dark:text-white">
              Nothing to see here!
            </h4>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black">
      <NavBar />

      <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">

          <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm dark:border-emerald-900/60 dark:bg-[#050806] dark:shadow-emerald-950/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-emerald-600 dark:text-emerald-400"
                    >
                      <path d="M4 17l6-6-6-6" />
                      <path d="M12 19h8" />
                    </svg>
                  </div>

                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                      Internal API Tester
                    </h1>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Test EVAT backend endpoints and inspect server responses.
                    </p>
                  </div>
                </div>
              </div>

              <div className="hidden rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-right dark:border-emerald-900/60 dark:bg-emerald-950/30 sm:block">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  Developer Tool
                </p>

                <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                  API testing environment
                </p>
              </div>

            </div>
          </div>

          <div className="container vertical auto-width">
            <div className="grid-content">

              <div>
                <ApiTesterHistory
                  history={history}
                  onLoad={loadFromHistory}
                  onClear={clearHistory}
                />

                <ApiTesterForm
                  method={method}
                  setMethod={setMethod}
                  endpoint={endpoint}
                  setEndpoint={setEndpoint}
                  body={body}
                  setBody={setBody}
                  token={token}
                  setToken={setToken}
                  showToken={showToken}
                  setShowToken={setShowToken}
                  loading={loading}
                  onSend={sendRequest}
                />

                <div className="spacer-small" />

                <ApiTesterResponse
                  response={response}
                  error={error}
                />
              </div>

              <ApiTesterSidebar
                onEndpointClick={handleEndpointClick}
              />

            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default ApiTester;
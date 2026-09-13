// src/components/api-tester/ApiTesterSidebar.jsx

import { useState } from 'react';
import {
  Search,
  ChevronDown,
  Shield,
  X,
} from 'lucide-react';

import {
  adminAuth,
  admin,
  booking,
  chargerReviews,
  chargerSessions,
  charger,
  feedback,
  navigation,
  profile,
  station,
  supportRequest,
  user,
  vehicle,
  iceVehicle,
} from '../../data/apiEndpoints';

const EndpointItem = ({ item, onEndpointClick }) => {
  const getMethodStyle = (method) => {
    switch (method?.toUpperCase()) {
      case 'GET':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/60';

      case 'POST':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60';

      case 'PUT':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60';

      case 'DELETE':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60';

      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700';
    }
  };

  return (
    <button
      type="button"
      onClick={() => onEndpointClick(item)}
      className="group mb-2 flex w-full items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50/40 hover:shadow-sm dark:border-emerald-900/60 dark:bg-[#050806] dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30"
    >
      <span
        className={`mt-0.5 min-w-[62px] rounded-md border px-2 py-1 text-center text-[11px] font-bold tracking-wide ${getMethodStyle(
          item.method
        )}`}
      >
        {item.method}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800 transition group-hover:text-emerald-700 dark:text-slate-200 dark:group-hover:text-emerald-400">
          {item.label}
        </p>

        <p className="mt-1 break-all font-mono text-xs text-slate-500 dark:text-slate-400">
          {item.endpoint}
        </p>
      </div>
    </button>
  );
};

const ApiTesterSidebar = ({ onEndpointClick }) => {
  const [search, setSearch] = useState('');

  const groups = [
    {
      title: 'Admin Auth Route',
      endpoints: adminAuth,
      isAdmin: true,
    },
    {
      title: 'Admin Route',
      endpoints: admin,
      isAdmin: true,
    },
    {
      title: 'Booking Route',
      endpoints: booking,
    },
    {
      title: 'Charger Reviews Route',
      endpoints: chargerReviews,
    },
    {
      title: 'Charger Session Route',
      endpoints: chargerSessions,
    },
    {
      title: 'Charger',
      endpoints: charger,
    },
    {
      title: 'Feedback Route',
      endpoints: feedback,
    },
    {
      title: 'Navigation Route',
      endpoints: navigation,
    },
    {
      title: 'Profile Route',
      endpoints: profile,
    },
    {
      title: 'Station Route',
      endpoints: station,
    },
    {
      title: 'Support Request Route',
      endpoints: supportRequest,
    },
    {
      title: 'User Route',
      endpoints: user,
    },
    {
      title: 'Vehicle Route',
      endpoints: vehicle,
    },
    {
      title: 'ICE Vehicle Route',
      endpoints: iceVehicle,
    },
  ];

  const searchTerm = search.trim().toLowerCase();

  const filteredGroups = groups
    .map((group) => ({
      ...group,
      endpoints: group.endpoints.filter((item) => {
        if (!searchTerm) {
          return true;
        }

        return (
          item.endpoint?.toLowerCase().includes(searchTerm) ||
          item.label?.toLowerCase().includes(searchTerm) ||
          item.method?.toLowerCase().includes(searchTerm)
        );
      }),
    }))
    .filter((group) => group.endpoints.length > 0);

  const resultCount = filteredGroups.reduce(
    (total, group) => total + group.endpoints.length,
    0
  );

  return (
    <aside className="flex h-full min-h-0 w-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-emerald-900/60 dark:bg-[#050806] dark:shadow-emerald-950/20">

      <div className="border-b border-slate-200 p-5 dark:border-emerald-900/60">
        <div className="mb-4 flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
            <Search
              size={20}
              className="text-emerald-600 dark:text-emerald-400"
              strokeWidth={2}
            />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Quick Endpoints
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select an endpoint to test
            </p>
          </div>

        </div>

        <div className="relative">

          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          />

          <input
            type="text"
            placeholder="Search endpoints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:bg-slate-900 dark:focus:ring-emerald-950"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear endpoint search"
              title="Clear search"
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X size={15} />
            </button>
          )}

        </div>

        {search && (
          <div className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
            {resultCount === 1
              ? '1 endpoint found'
              : `${resultCount} endpoints found`}
          </div>
        )}

      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">

        {filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center dark:border-slate-700 dark:bg-slate-900/60">

            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Search
                size={22}
                className="text-slate-400 dark:text-slate-500"
              />
            </div>

            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              No endpoints found
            </p>

            <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">
              No endpoints match "{search}".
              Try searching by endpoint, label, or HTTP method.
            </p>

            <button
              type="button"
              onClick={() => setSearch('')}
              className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 dark:bg-emerald-500 dark:text-black dark:hover:bg-emerald-400"
            >
              Clear Search
            </button>

          </div>
        ) : (
          <div className="space-y-3">

            {filteredGroups.map((group, index) => (
              <details
                key={`${group.title}-${index}`}
                open
                className="group/details overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-emerald-900/60 dark:bg-slate-900/50"
              >

                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 transition hover:bg-slate-100 [&::-webkit-details-marker]:hidden dark:hover:bg-emerald-950/30">

                  <div className="flex min-w-0 items-center gap-2">

                    {group.isAdmin && (
                      <Shield
                        size={15}
                        className="shrink-0 text-amber-500"
                        strokeWidth={2}
                      />
                    )}

                    <span
                      className={`truncate text-sm font-bold ${
                        group.isAdmin
                          ? 'text-slate-800 dark:text-slate-200'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {group.title}
                    </span>

                    {search && (
                      <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-400">
                        {group.endpoints.length}
                      </span>
                    )}

                  </div>

                  <ChevronDown
                    size={17}
                    className="shrink-0 text-slate-400 transition-transform group-open/details:rotate-180 dark:text-slate-500"
                  />

                </summary>

                {group.isAdmin && (
                  <div className="mx-3 mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900/60 dark:bg-amber-950/30">
                    <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                      Admin endpoint
                    </p>
                  </div>
                )}

                <div className="border-t border-slate-200 bg-white p-3 dark:border-emerald-900/60 dark:bg-[#030504]">

                  {group.endpoints.map((item, idx) => (
                    <EndpointItem
                      key={`${item.endpoint}-${idx}`}
                      item={item}
                      onEndpointClick={onEndpointClick}
                    />
                  ))}

                </div>

              </details>
            ))}

          </div>
        )}

      </div>

    </aside>
  );
};

export default ApiTesterSidebar;
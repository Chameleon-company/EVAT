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


// ============================================================
// Endpoint Item
// ============================================================

const EndpointItem = ({ item, onEndpointClick }) => {
  const getMethodStyle = (method) => {
    switch (method?.toUpperCase()) {
      case 'GET':
        return 'bg-blue-50 text-blue-700 border-blue-200';

      case 'POST':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';

      case 'PUT':
        return 'bg-amber-50 text-amber-700 border-amber-200';

      case 'DELETE':
        return 'bg-red-50 text-red-700 border-red-200';

      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <button
      type="button"
      onClick={() => onEndpointClick(item)}
      className="group mb-2 flex w-full items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50/40 hover:shadow-sm"
    >
      {/* HTTP method */}
      <span
        className={`mt-0.5 min-w-[62px] rounded-md border px-2 py-1 text-center text-[11px] font-bold tracking-wide ${getMethodStyle(
          item.method
        )}`}
      >
        {item.method}
      </span>

      {/* Endpoint information */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800 transition group-hover:text-emerald-700">
          {item.label}
        </p>

        <p className="mt-1 break-all font-mono text-xs text-slate-500">
          {item.endpoint}
        </p>
      </div>
    </button>
  );
};


// ============================================================
// Sidebar
// ============================================================

const ApiTesterSidebar = ({ onEndpointClick }) => {
  const [search, setSearch] = useState('');

  // All endpoint groups
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

  // ==========================================================
  // Filter endpoints
  // ==========================================================

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
    <aside className="flex h-full min-h-0 w-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* ======================================================
          Sidebar Header
      ====================================================== */}

      <div className="border-b border-slate-200 p-5">

        <div className="mb-4 flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
            <Search
              size={20}
              className="text-emerald-600"
              strokeWidth={2}
            />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Quick Endpoints
            </h2>

            <p className="text-xs text-slate-500">
              Select an endpoint to test
            </p>
          </div>

        </div>


        {/* ====================================================
            Search
        ==================================================== */}

        <div className="relative">

          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search endpoints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear endpoint search"
              title="Clear search"
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
            >
              <X size={15} />
            </button>
          )}

        </div>


        {/* Search result count */}

        {search && (
          <div className="mt-3 text-xs font-medium text-slate-500">
            {resultCount === 1
              ? '1 endpoint found'
              : `${resultCount} endpoints found`}
          </div>
        )}

      </div>


      {/* ======================================================
          Endpoint List
      ====================================================== */}

      <div className="min-h-0 flex-1 overflow-y-auto p-4">

        {filteredGroups.length === 0 ? (
          /* ==================================================
             No Results
          ================================================== */

          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">

            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Search
                size={22}
                className="text-slate-400"
              />
            </div>

            <p className="text-sm font-bold text-slate-700">
              No endpoints found
            </p>

            <p className="mt-1 max-w-xs text-xs text-slate-500">
              No endpoints match "{search}".
              Try searching by endpoint, label, or HTTP method.
            </p>

            <button
              type="button"
              onClick={() => setSearch('')}
              className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
            >
              Clear Search
            </button>

          </div>

        ) : (
          /* ==================================================
             Endpoint Groups
          ================================================== */

          <div className="space-y-3">

            {filteredGroups.map((group, index) => (
              <details
                key={`${group.title}-${index}`}
                open
                className="group/details overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
              >

                {/* =================================================
                    Group Header
                ================================================= */}

                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 transition hover:bg-slate-100 [&::-webkit-details-marker]:hidden">

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
                          ? 'text-slate-800'
                          : 'text-slate-700'
                      }`}
                    >
                      {group.title}
                    </span>

                    {search && (
                      <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 shadow-sm">
                        {group.endpoints.length}
                      </span>
                    )}

                  </div>


                  <ChevronDown
                    size={17}
                    className="shrink-0 text-slate-400 transition-transform group-open/details:rotate-180"
                  />

                </summary>


                {/* =================================================
                    Admin Notice
                ================================================= */}

                {group.isAdmin && (
                  <div className="mx-3 mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                    <p className="text-[11px] font-medium text-amber-700">
                      Admin endpoint
                    </p>
                  </div>
                )}


                {/* =================================================
                    Endpoints
                ================================================= */}

                <div className="border-t border-slate-200 bg-white p-3">

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
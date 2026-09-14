import React, { useState, useContext } from 'react';
import { UserContext } from '../context/user';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import logo from '../assets/logo.png';
import {
  Menu,
  LogOut,
  ChevronDown,
  Bell,
  Sun,
  Moon,
} from 'lucide-react';

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mainMenu, setMainMenuOpen] = useState(false);
  const [devMenu, setDevMenuOpen] = useState(false);

  const isDev = import.meta.env.DEV;

  const { user } = useContext(UserContext);
  const { theme, toggleTheme } = useTheme();

  const isActive = (path) => location.pathname === path;

  const handleSignOut = () => {
    localStorage.removeItem('currentUser');
    navigate('/signin');
  };

  const toggleMainMenu = () => {
    setMainMenuOpen((prev) => !prev);
    setDevMenuOpen(false);
  };

  const toggleDevMenu = () => {
    setDevMenuOpen((prev) => !prev);
    setMainMenuOpen(false);
  };

  const navigateTo = (path) => {
    setMainMenuOpen(false);
    setDevMenuOpen(false);
    navigate(path);
  };

  const mainMenuItems = [
    { label: 'Profile', path: '/profile' },
    { label: 'Map', path: '/map' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Favourite Chargers', path: '/favourites' },
    { label: 'Rewards', path: '/game' },
    { label: 'Feedback', path: '/feedback' },
    { label: 'Support', path: '/support' },
  ];

  const developerMenuItems = [
    { label: 'Use Case Dashboard', path: '/use-cases' },
    { label: 'API Tester', path: '/apitester' },
    { label: 'Voice Query', path: '/voice-query' },
    { label: 'Cost Comparison', path: '/cost-comparison' },
    { label: 'Environmental Impact', path: '/environmental-impact' },
    { label: 'Demand Forecasting', path: '/demand-forecasting' },
    { label: 'Price Prediction', path: '/price-prediction' },
    { label: 'Reliability Scoring', path: '/reliability-scoring' },
    { label: 'Congestion Prediction', path: '/congestion-prediction' },
    { label: 'Weather Routing', path: '/weather-routing' },
    { label: 'Chatbot', path: '/chatbot' },
  ];

  const getUserName = () => {
    if (!user) return 'Account';

    const fullName = [
      user?.firstName,
      user?.lastName,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    return fullName || 'Account';
  };

  return (
    <nav
      className="
        sticky top-0 z-50 flex h-(--header-height) w-full
        items-center border-b px-5
        border-slate-200 bg-white
        dark:border-gray-800 dark:bg-black
      "
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={toggleMainMenu}
            aria-label="Open main menu"
            aria-expanded={mainMenu}
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition ${
              mainMenu
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-gray-300 dark:hover:bg-gray-900 dark:hover:text-white'
            }`}
          >
            <Menu size={22} strokeWidth={1.8} />
          </button>

          {mainMenu && (
            <div
              className="
                absolute left-0 top-12 z-50 w-60 overflow-hidden
                rounded-xl border py-2
                border-slate-200 bg-white
                shadow-[0_8px_30px_rgba(15,23,42,0.10)]
                dark:border-gray-800 dark:bg-gray-950
                dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)]
              "
            >
              {mainMenuItems.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigateTo(item.path)}
                  className={`flex w-full items-center border-l-2 px-5 py-2.5 text-left text-sm transition ${
                    isActive(item.path)
                      ? 'border-emerald-500 bg-emerald-50 font-semibold text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                      : 'border-transparent font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:text-gray-300 dark:hover:bg-gray-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigate('/map')}
          className="
            flex items-center gap-3 rounded-lg px-2 py-1.5
            text-left transition
            hover:bg-slate-50
            dark:hover:bg-gray-900
          "
          aria-label="Go to map"
        >
          <img
            src={logo}
            alt="EVAT Logo"
            className="h-9 w-9 object-contain"
          />

          <span
            className="
              hidden whitespace-nowrap text-[18px] font-bold
              tracking-[-0.02em] sm:block
              text-slate-900 dark:text-white
            "
          >
            Electric Vehicle Adoption Tool
          </span>
        </button>

        {isDev && (
          <div className="relative hidden md:block">
            <button
              type="button"
              onClick={toggleDevMenu}
              aria-expanded={devMenu}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                devMenu
                  ? 'bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-white'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-gray-300 dark:hover:bg-gray-900 dark:hover:text-white'
              }`}
            >
              Developer Pages

              <ChevronDown
                size={16}
                strokeWidth={1.8}
                className={`transition-transform ${
                  devMenu ? 'rotate-180' : ''
                }`}
              />
            </button>

            {devMenu && (
              <div
                className="
                  absolute left-0 top-11 z-50 w-64 overflow-hidden
                  rounded-xl border py-2
                  border-slate-200 bg-white
                  shadow-[0_8px_30px_rgba(15,23,42,0.10)]
                  dark:border-gray-800 dark:bg-gray-950
                  dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)]
                "
              >
                {developerMenuItems.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => navigateTo(item.path)}
                    className={`flex w-full items-center border-l-2 px-5 py-2.5 text-left text-sm transition ${
                      isActive(item.path)
                        ? 'border-emerald-500 bg-emerald-50 font-semibold text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                        : 'border-transparent font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:text-gray-300 dark:hover:bg-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div
          id="navbar-chat-trigger"
          className="flex items-center"
        />

        <button
          type="button"
          aria-label="Notifications"
          className="
            relative flex h-10 w-10 items-center justify-center
            rounded-full transition
            text-slate-600 hover:bg-slate-50 hover:text-slate-900
            dark:text-gray-300 dark:hover:bg-gray-900 dark:hover:text-white
          "
        >
          <Bell size={21} strokeWidth={1.8} />

          <span
            className="
              absolute right-2 top-1.75 h-2 w-2 rounded-full
              border-2 border-white bg-emerald-500
              dark:border-black
            "
          />
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={
            theme === 'dark'
              ? 'Switch to light mode'
              : 'Switch to dark mode'
          }
          title={
            theme === 'dark'
              ? 'Switch to light mode'
              : 'Switch to dark mode'
          }
          className="
            flex h-10 w-10 items-center justify-center
            rounded-full transition
            text-slate-600 hover:bg-slate-100 hover:text-slate-900
            dark:text-emerald-400 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300
          "
        >
          {theme === 'dark' ? (
            <Sun size={20} strokeWidth={1.8} />
          ) : (
            <Moon size={20} strokeWidth={1.8} />
          )}
        </button>

        <button
          type="button"
          onClick={() => navigate('/profile')}
          aria-label="Open profile"
          className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition ${
            isActive('/profile')
              ? 'bg-emerald-50 dark:bg-emerald-950'
              : 'hover:bg-slate-50 dark:hover:bg-gray-900'
          }`}
        >
          <img
            src={
              user?.avatarURL ||
              'defaultProfilePictures/default-white.png'
            }
            alt="User Avatar"
            className="
              h-9 w-9 rounded-full border object-cover
              border-slate-200 bg-slate-100
              dark:border-gray-700 dark:bg-gray-900
            "
            key={user?.avatarURL}
          />

          <span
            className="
              hidden max-w-36 truncate text-sm font-semibold
              text-slate-800 dark:text-gray-200
              lg:block
            "
          >
            {getUserName()}
          </span>

          <ChevronDown
            size={16}
            strokeWidth={1.8}
            className="hidden text-slate-500 dark:text-gray-400 lg:block"
          />
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          aria-label="Sign out"
          title="Sign out"
          className="
            flex h-10 w-10 items-center justify-center rounded-full
            text-slate-500 transition
            hover:bg-red-50 hover:text-red-600
            dark:text-gray-400 dark:hover:bg-red-950 dark:hover:text-red-400
          "
        >
          <LogOut size={20} strokeWidth={1.8} />
        </button>
      </div>
    </nav>
  );
}

export default NavBar;
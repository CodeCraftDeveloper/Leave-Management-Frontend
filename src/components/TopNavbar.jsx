import { Link, useLocation } from 'react-router-dom';
import { FiBell, FiMoon, FiSun, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useEffect, useState } from 'react';
import { getNotifications } from '../services/notificationService';

export default function TopNavbar() {
  const { logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    getNotifications().then((d) => setUnread(d.unread || 0)).catch(() => {});
  }, [pathname]);

  return (
    <header className="sticky top-0 z-20 bg-white text-slate-900 border-b border-slate-200 shadow-sm">
      <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-8">
        <Link
          to="/"
          aria-label="Go to dashboard"
          className="grid h-11 w-14 shrink-0 place-items-center overflow-hidden"
        >
          <img src="/image.avif" alt="Prem Industries" className="h-10 w-14 object-contain" />
        </Link>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="h-10 w-10 grid place-items-center rounded-full text-slate-700 transition hover:bg-slate-100 active:bg-slate-200"
          >
            {theme === 'dark' ? <FiSun /> : <FiMoon />}
          </button>
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="h-10 w-10 grid place-items-center rounded-full text-slate-700 transition hover:bg-slate-100 active:bg-slate-200 relative"
          >
            <FiBell />
            {unread > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </Link>
          <button
            onClick={logout}
            aria-label="Logout"
            className="lg:hidden h-10 w-10 grid place-items-center rounded-full text-slate-700 transition hover:bg-slate-100 active:bg-slate-200"
          >
            <FiLogOut />
          </button>
        </div>
      </div>
    </header>
  );
}

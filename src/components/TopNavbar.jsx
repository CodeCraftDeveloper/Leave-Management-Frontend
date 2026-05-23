import { Link, useLocation } from 'react-router-dom';
import { FiBell, FiMoon, FiSun, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useEffect, useState } from 'react';
import { getNotifications } from '../services/notificationService';

const titles = {
  '/': 'Dashboard',
  '/apply': 'Apply Leave',
  '/history': 'Leave History',
  '/calendar': 'Calendar',
  '/notifications': 'Notifications',
  '/profile': 'Profile',
};

export default function TopNavbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    getNotifications().then((d) => setUnread(d.unread || 0)).catch(() => {});
  }, [pathname]);

  return (
    <header className="sticky top-0 z-20 glass border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between px-4 lg:px-8 py-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">Hi, {user?.name?.split(' ')[0]}</p>
          <h2 className="text-lg font-bold truncate">{titles[pathname] || 'Leave Portal'}</h2>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggle} className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            {theme === 'dark' ? <FiSun /> : <FiMoon />}
          </button>
          <Link to="/notifications" className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 relative">
            <FiBell />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </Link>
          <button onClick={logout} className="lg:hidden p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <FiLogOut />
          </button>
        </div>
      </div>
    </header>
  );
}

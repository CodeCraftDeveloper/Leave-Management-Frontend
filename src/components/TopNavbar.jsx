import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { getNotifications } from '../services/notificationService';

export default function TopNavbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    getNotifications().then((d) => setUnread(d.unread || 0)).catch(() => {});
  }, [pathname]);

  return (
    <header className="sticky top-0 z-20 bg-surface border-b border-outline-variant/60 h-16 flex items-center justify-between px-4 w-full">
      <div className="flex items-center gap-3">
        {/* Profile Avatar / Initials linking to Profile */}
        <Link
          to="/profile"
          className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm overflow-hidden border border-outline-variant/60 shrink-0 hover:scale-95 transition-transform"
        >
          {user?.name ? (
            user.name[0].toUpperCase()
          ) : (
            <span className="material-symbols-outlined text-[16px]">person</span>
          )}
        </Link>
        <span className="font-bold text-headline-sm text-primary tracking-tight truncate max-w-[180px] sm:max-w-none">
          Prem Industries
        </span>
      </div>

      <div className="flex items-center gap-1">
        {/* Notifications Icon with Unread Badge */}
        <Link
          to="/notifications"
          aria-label="Notifications"
          className="w-10 h-10 rounded-full flex items-center justify-center text-primary hover:bg-surface-container-low transition-transform active:scale-95 relative"
        >
          <span className="material-symbols-outlined">notifications</span>
          {unread > 0 && (
            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-secondary rounded-full border-2 border-surface shadow-[0_0_6px_rgba(187,0,21,0.6)]"></span>
          )}
        </Link>

        {/* Logout (Mobile Only) */}
        <button
          onClick={logout}
          aria-label="Logout"
          className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center text-primary hover:bg-surface-container-low transition-transform active:scale-95"
        >
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>
    </header>
  );
}

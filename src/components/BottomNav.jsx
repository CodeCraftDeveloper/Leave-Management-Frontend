import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { getNotifications } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import { getNavItemsForUser } from './navigationItems';

export default function BottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const allItems = getNavItemsForUser(user);
  const primaryItems = allItems.filter((item) => ['/', '/apply', '/calendar', '/notifications', '/profile'].includes(item.to));
  const overflowItems = [];
  const moreActive = overflowItems.some((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));

  useEffect(() => {
    getNotifications()
      .then((d) => setUnread(d.unread || 0))
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  return (
    <>
      {moreOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="lg:hidden fixed inset-0 z-20 bg-black/20"
          onClick={() => setMoreOpen(false)}
        />
      )}
      {moreOpen && (
        <div className="lg:hidden fixed inset-x-4 bottom-24 z-40 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-2 shadow-xl">
          {overflowItems.map(({ to, materialIcon, mobileLabel, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface hover:bg-surface-container-low'
                }`
              }
            >
              <span className="material-symbols-outlined text-[22px]">{materialIcon}</span>
              <span>{mobileLabel || label}</span>
            </NavLink>
          ))}
        </div>
      )}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-primary text-on-primary rounded-t-xl shadow-lg flex justify-around items-center px-3 py-2 safe-bottom">
        {primaryItems.map(({ to, materialIcon, mobileLabel, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-2 rounded-xl transition-all w-16 relative duration-150 ${
                isActive
                  ? 'bg-primary-container/20 text-on-primary scale-95'
                  : 'text-on-primary/70 hover:bg-primary-container/10'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className="material-symbols-outlined mb-0.5"
                  data-weight={isActive ? 'fill' : 'normal'}
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {materialIcon}
                </span>
                <span className="font-medium text-[11px] tracking-tight">{mobileLabel || label}</span>
                {to === '/notifications' && unread > 0 && (
                  <span className="absolute top-1.5 right-4 w-2 h-2 rounded-full bg-secondary shadow-[0_0_6px_rgba(187,0,21,0.6)]"></span>
                )}
              </>
            )}
          </NavLink>
        ))}
        {overflowItems.length > 0 && (
          <button
            type="button"
            aria-label="More navigation options"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((open) => !open)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all w-16 relative duration-150 ${
              moreActive || moreOpen
                ? 'bg-primary-container/20 text-on-primary scale-95'
                : 'text-on-primary/70 hover:bg-primary-container/10'
            }`}
          >
            <span
              className="material-symbols-outlined mb-0.5"
              style={moreActive || moreOpen ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              more_horiz
            </span>
            <span className="font-medium text-[11px] tracking-tight">More</span>
          </button>
        )}
      </nav>
    </>
  );
}

import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { getNotifications } from '../services/notificationService';

const items = [
  { to: '/', icon: 'home', label: 'Home', end: true },
  { to: '/apply', icon: 'add_circle', label: 'Apply' },
  { to: '/calendar', icon: 'calendar_month', label: 'Calendar' },
  { to: '/notifications', icon: 'notifications', label: 'Alerts' },
  { to: '/profile', icon: 'person', label: 'Profile' },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    getNotifications()
      .then((d) => setUnread(d.unread || 0))
      .catch(() => {});
  }, [pathname]);

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-primary text-on-primary rounded-t-xl shadow-lg flex justify-around items-center px-4 py-2 safe-bottom">
      {items.map(({ to, icon, label, end }) => (
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
                {icon}
              </span>
              <span className="font-medium text-[11px] tracking-tight">{label}</span>
              {label === 'Alerts' && unread > 0 && (
                <span className="absolute top-1.5 right-4 w-2 h-2 rounded-full bg-secondary shadow-[0_0_6px_rgba(187,0,21,0.6)]"></span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

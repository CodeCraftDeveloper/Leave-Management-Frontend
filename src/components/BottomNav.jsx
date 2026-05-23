import { NavLink } from 'react-router-dom';
import { FiHome, FiPlusCircle, FiCalendar, FiBell, FiUser } from 'react-icons/fi';

const items = [
  { to: '/', icon: FiHome, label: 'Home', end: true },
  { to: '/apply', icon: FiPlusCircle, label: 'Apply' },
  { to: '/calendar', icon: FiCalendar, label: 'Calendar' },
  { to: '/notifications', icon: FiBell, label: 'Alerts' },
  { to: '/profile', icon: FiUser, label: 'Profile' },
];

export default function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 glass border-t border-slate-200 dark:border-slate-800 safe-bottom">
      <ul className="grid grid-cols-5 max-w-md mx-auto">
        {items.map(({ to, icon: Icon, label, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2.5 px-2 gap-0.5 text-[11px] font-medium transition ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`w-10 h-7 grid place-items-center rounded-full transition ${
                      isActive ? 'bg-primary-100 dark:bg-primary-500/20' : ''
                    }`}
                  >
                    <Icon className="text-lg" />
                  </div>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

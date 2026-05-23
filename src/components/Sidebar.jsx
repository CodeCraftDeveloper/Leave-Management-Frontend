import { NavLink } from 'react-router-dom';
import { FiHome, FiPlusCircle, FiCalendar, FiBell, FiUser, FiLogOut, FiClock } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import BrandLogo from './BrandLogo';

const items = [
  { to: '/', icon: FiHome, label: 'Dashboard', end: true },
  { to: '/apply', icon: FiPlusCircle, label: 'Apply Leave' },
  { to: '/history', icon: FiClock, label: 'Leave History' },
  { to: '/calendar', icon: FiCalendar, label: 'Calendar' },
  { to: '/notifications', icon: FiBell, label: 'Notifications' },
  { to: '/profile', icon: FiUser, label: 'Profile' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <BrandLogo subtitle="Employee Portal" />
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {items.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-card'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`
            }
          >
            <Icon className="text-lg" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-300 grid place-items-center font-semibold">
            {user?.name?.[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.employeeId}</p>
          </div>
        </div>
        <button onClick={logout} className="btn-outline w-full">
          <FiLogOut /> Logout
        </button>
      </div>
    </aside>
  );
}

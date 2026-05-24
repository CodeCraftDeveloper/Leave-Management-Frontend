import { NavLink } from 'react-router-dom';
import { FiHome, FiPlusCircle, FiCalendar, FiBell, FiUser, FiLogOut, FiClock } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import BrandLogo from './BrandLogo';

const items = [
  { to: '/', icon: FiHome, label: 'Dashboard', end: true },
  { to: '/apply', icon: FiPlusCircle, label: 'Apply Leave' },
  { to: '/calendar?tab=history', icon: FiClock, label: 'Leave History' },
  { to: '/calendar', icon: FiCalendar, label: 'Calendar', end: true },
  { to: '/notifications', icon: FiBell, label: 'Notifications' },
  { to: '/profile', icon: FiUser, label: 'Profile' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-outline-variant/60 bg-surface-container-lowest">
      <div className="p-6 border-b border-outline-variant/30">
        <BrandLogo subtitle="Employee Portal" />
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {items.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                isActive
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`
            }
          >
            <Icon className="text-lg" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-outline-variant/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container grid place-items-center font-semibold border border-outline-variant/65">
            {user?.name?.[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-xs text-on-surface-variant/75 truncate">{user?.employeeId}</p>
          </div>
        </div>
        <button onClick={logout} className="btn-outline w-full">
          <FiLogOut /> Logout
        </button>
      </div>
    </aside>
  );
}

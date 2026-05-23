import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { FiHome, FiFileText, FiUsers, FiCalendar, FiLogOut, FiMoon, FiSun, FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';
import EmailSetupModal from '../components/EmailSetupModal';

const items = [
  { to: '/admin', icon: FiHome, label: 'Dashboard', end: true },
  { to: '/admin/leaves', icon: FiFileText, label: 'Leave Requests' },
  { to: '/admin/employees', icon: FiUsers, label: 'Employees' },
  { to: '/admin/calendar', icon: FiCalendar, label: 'Calendar' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 grid place-items-center text-white font-bold">
              A
            </div>
            <div>
              <p className="font-bold">Admin Console</p>
              <p className="text-xs text-slate-500">Leave Management</p>
            </div>
          </div>
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
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button onClick={toggle} className="btn-outline w-full">
            {theme === 'dark' ? <FiSun /> : <FiMoon />} Theme
          </button>
          <button onClick={logout} className="btn-outline w-full">
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-900 p-4 flex flex-col">
            <button onClick={() => setOpen(false)} className="self-end p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
              <FiX />
            </button>
            <nav className="space-y-1 mt-2">
              {items.map(({ to, icon: Icon, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                      isActive
                        ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon /> {label}
                </NavLink>
              ))}
            </nav>
            <button onClick={logout} className="btn-outline mt-auto">
              <FiLogOut /> Logout
            </button>
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 glass border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between px-4 lg:px-8 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setOpen(true)} className="lg:hidden p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                <FiMenu />
              </button>
              <div>
                <p className="text-xs text-slate-500">Admin</p>
                <h2 className="text-lg font-bold">{user?.name}</h2>
              </div>
            </div>
            <button onClick={toggle} className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
              {theme === 'dark' ? <FiSun /> : <FiMoon />}
            </button>
          </div>
        </header>
        <main className="flex-1 px-4 lg:px-8 py-5 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
      <EmailSetupModal />
    </div>
  );
}

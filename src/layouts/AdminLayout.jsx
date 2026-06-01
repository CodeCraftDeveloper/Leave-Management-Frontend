import { NavLink, Outlet } from 'react-router-dom';
import { FiHome, FiFileText, FiUsers, FiCalendar, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';
import EmailSetupModal from '../components/EmailSetupModal';
import BrandLogo from '../components/BrandLogo';
import { isSuperAdmin } from '../utils/roles';

// Departments management is a global power — only the super admin gets that nav
// entry. Scoped heads see only their own department's data on the other pages.
const baseItems = [
  { to: '/head', icon: FiHome, label: 'Dashboard', end: true, headOnly: true },
  { to: '/head/leaves', icon: FiFileText, label: 'Leave Requests' },
  { to: '/head/employees', icon: FiUsers, label: 'Employees', headOnly: true },
  { to: '/head/calendar', icon: FiCalendar, label: 'Calendar', headOnly: true },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const superAdmin = isSuperAdmin(user);
  const items = baseItems.filter((item) =>
    (!item.superAdminOnly || superAdmin) && (!item.headOnly || user?.role === 'head')
  );
  const consoleLabel = user?.role === 'dept_head'
    ? 'Department Head Console'
    : superAdmin
      ? 'Super Admin Console'
      : 'Head Console';

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-outline-variant/60 bg-surface-container-lowest">
        <div className="p-6 border-b border-outline-variant/30">
          <BrandLogo subtitle={consoleLabel} />
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
        <div className="p-4 border-t border-outline-variant/30 space-y-2">
          <button onClick={logout} className="btn-outline w-full">
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-[#0b1c30]/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-surface-container-lowest p-4 flex flex-col border-r border-outline-variant/60">
            <button onClick={() => setOpen(false)} className="self-end p-2 rounded-full hover:bg-surface-container-low text-primary">
              <FiX />
            </button>
            <BrandLogo subtitle={consoleLabel} className="mt-2 mb-4" />
            <nav className="space-y-1 mt-2">
              {items.map(({ to, icon: Icon, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                      isActive
                        ? 'bg-primary text-on-primary'
                        : 'text-on-surface-variant hover:bg-surface-container-low'
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
        <header className="sticky top-0 z-20 bg-surface border-b border-outline-variant/60">
          <div className="flex items-center justify-between px-4 lg:px-8 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setOpen(true)} className="lg:hidden p-2 rounded-full hover:bg-surface-container-low text-primary">
                <FiMenu />
              </button>
              <div>
                <p className="text-xs text-on-surface-variant/75 font-medium">
                  {user?.role === 'dept_head' ? 'Department Head' : superAdmin ? 'Super Admin' : 'Head'}
                </p>
                <h2 className="text-lg font-bold">{user?.name}</h2>
              </div>
            </div>
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

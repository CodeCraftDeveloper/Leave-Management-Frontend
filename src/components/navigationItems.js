import {
  FiBell,
  FiCalendar,
  FiClock,
  FiHome,
  FiPlusCircle,
  FiUser,
} from 'react-icons/fi';

const tabOf = (search) => new URLSearchParams(search || '').get('tab');

export const employeeNavItems = [
  { to: '/', icon: FiHome, materialIcon: 'home', label: 'Dashboard', mobileLabel: 'Home', end: true },
  { to: '/apply', icon: FiPlusCircle, materialIcon: 'add_circle', label: 'Apply Leave', mobileLabel: 'Apply' },
  {
    to: '/calendar?tab=history',
    icon: FiClock,
    materialIcon: 'history',
    label: 'Leave History',
    mobileLabel: 'History',
    // Shares the /calendar pathname with the Calendar item below; NavLink ignores
    // the query string, so disambiguate on the `tab` param to avoid both lighting up.
    match: (location) => location.pathname === '/calendar' && tabOf(location.search) === 'history',
  },
  {
    to: '/calendar',
    icon: FiCalendar,
    materialIcon: 'calendar_month',
    label: 'Calendar',
    mobileLabel: 'Calendar',
    end: true,
    match: (location) => location.pathname === '/calendar' && tabOf(location.search) !== 'history',
  },
  { to: '/notifications', icon: FiBell, materialIcon: 'notifications', label: 'Notifications', mobileLabel: 'Alerts' },
  { to: '/profile', icon: FiUser, materialIcon: 'person', label: 'Profile', mobileLabel: 'Profile' },
];

export const canReviewLeaveRequests = () => false;

export const getNavItemsForUser = () => employeeNavItems;

// Resolve a nav item's active state. Items with a `match` predicate are
// query-aware (NavLink only matches on pathname); the rest fall back to the
// router-provided isActive.
export const isNavItemActive = (item, location, routerIsActive) =>
  item.match ? item.match(location) : routerIsActive;

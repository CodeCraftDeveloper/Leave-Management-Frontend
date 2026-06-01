import {
  FiBell,
  FiCalendar,
  FiClock,
  FiHome,
  FiPlusCircle,
  FiUser,
  FiFileText,
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

// The "Leave Requests" review queue is restricted to the two department heads
// who actually action requests: Shikhar Tripathi (H641, Digital Market) and
// Praveen Kumar (H317, Accounts). Every other user — including other listed
// department heads — does not see the sidebar entry or the /review page.
export const REVIEW_QUEUE_EMPLOYEE_IDS = Object.freeze(['H641', 'H317']);

export const canReviewLeaveRequests = (user) =>
  !!user &&
  REVIEW_QUEUE_EMPLOYEE_IDS.includes(String(user.employeeId || '').toUpperCase());

// Department heads also apply for their own leave through the employee portal,
// so the allowlisted reviewers get the full employee nav plus a "Leave Requests"
// entry that renders the review queue inside the portal (route /review) — keeping
// the full sidebar instead of bouncing to the sparse head console. (Full heads
// never see this sidebar; they live in the AdminLayout console.)
const reviewerNavItem = {
  to: '/review',
  icon: FiFileText,
  materialIcon: 'fact_check',
  label: 'Leave Requests',
  mobileLabel: 'Review',
  match: (location) => location.pathname === '/review',
};

export const getNavItemsForUser = (user) =>
  canReviewLeaveRequests(user)
    ? [...employeeNavItems, reviewerNavItem]
    : employeeNavItems;

// Resolve a nav item's active state. Items with a `match` predicate are
// query-aware (NavLink only matches on pathname); the rest fall back to the
// router-provided isActive.
export const isNavItemActive = (item, location, routerIsActive) =>
  item.match ? item.match(location) : routerIsActive;

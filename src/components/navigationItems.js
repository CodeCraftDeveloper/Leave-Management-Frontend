import {
  FiBell,
  FiCalendar,
  FiClock,
  FiHome,
  FiPlusCircle,
  FiUser,
} from 'react-icons/fi';

export const employeeNavItems = [
  { to: '/', icon: FiHome, materialIcon: 'home', label: 'Dashboard', mobileLabel: 'Home', end: true },
  { to: '/apply', icon: FiPlusCircle, materialIcon: 'add_circle', label: 'Apply Leave', mobileLabel: 'Apply' },
  { to: '/calendar?tab=history', icon: FiClock, materialIcon: 'history', label: 'Leave History', mobileLabel: 'History' },
  { to: '/calendar', icon: FiCalendar, materialIcon: 'calendar_month', label: 'Calendar', mobileLabel: 'Calendar', end: true },
  { to: '/notifications', icon: FiBell, materialIcon: 'notifications', label: 'Notifications', mobileLabel: 'Alerts' },
  { to: '/profile', icon: FiUser, materialIcon: 'person', label: 'Profile', mobileLabel: 'Profile' },
];

export const getNavItemsForRole = () => employeeNavItems;

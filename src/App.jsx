import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import ApplyLeave from './pages/ApplyLeave';
import CalendarPage from './pages/CalendarPage';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCalendar from './pages/admin/AdminCalendar';
import ReviewQueue from './pages/manage/ReviewQueue';
import HeadEmployees from './pages/head/HeadEmployees';
import { REVIEW_QUEUE_EMPLOYEE_IDS } from './components/navigationItems';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      <Route
        path="/"
        element={
          <ProtectedRoute roles={['employee', 'dept_head']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="apply" element={<ApplyLeave />} />
        <Route path="history" element={<Navigate to="/calendar?tab=history" replace />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
        {/* The review queue lives inside the employee portal (full sidebar) but is
            restricted to the two department heads who action requests — Shikhar
            (H641) and Praveen (H317). Everyone else is bounced back to '/'. */}
        <Route
          path="review"
          element={
            <ProtectedRoute employeeIds={REVIEW_QUEUE_EMPLOYEE_IDS}>
              <ReviewQueue title="Leaves Register" subtitle="Leave applications routed to you for review and export" />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route
        path="/head"
        element={
          <ProtectedRoute roles={['head']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="leaves" element={<ReviewQueue title="Leaves Register" subtitle="Employee leave applications routed to this Head for review and export" />} />
        <Route path="employees" element={<HeadEmployees />} />
        <Route path="calendar" element={<AdminCalendar />} />
      </Route>

      <Route path="/admin" element={<Navigate to="/head" replace />} />
      <Route path="/admin/*" element={<Navigate to="/head" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

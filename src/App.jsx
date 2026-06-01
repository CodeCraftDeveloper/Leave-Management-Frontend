import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import ApplyLeave from './pages/ApplyLeave';
import LeaveHistory from './pages/LeaveHistory';
import CalendarPage from './pages/CalendarPage';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCalendar from './pages/admin/AdminCalendar';
import ReviewQueue from './pages/manage/ReviewQueue';
import HeadEmployees from './pages/head/HeadEmployees';

function HeadHome() {
  const { user } = useAuth();
  if (user?.role === 'dept_head') return <Navigate to="/head/leaves" replace />;
  return <AdminDashboard />;
}

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
      </Route>

      <Route
        path="/head"
        element={
          <ProtectedRoute roles={['head', 'dept_head']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HeadHome />} />
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

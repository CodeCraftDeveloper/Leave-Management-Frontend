import { Routes, Route, Navigate } from 'react-router-dom';
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
import MyTeam from './pages/manage/MyTeam';
import HeadEmployees from './pages/head/HeadEmployees';
import HeadDepartments from './pages/head/HeadDepartments';

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
        path="/manage"
        element={
          <ProtectedRoute roles={['dept_head']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/manage/leaves" replace />} />
        <Route path="leaves" element={<ReviewQueue title="Leave Requests" subtitle="Employee requests routed to your department" />} />
        <Route path="team" element={<MyTeam />} />
      </Route>

      <Route
        path="/head"
        element={
          <ProtectedRoute role="head">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="leaves" element={<ReviewQueue title="Leaves Register" subtitle="All employee and department-head leave applications for Head review and export" />} />
        <Route path="employees" element={<HeadEmployees />} />
        <Route path="departments" element={<HeadDepartments />} />
        <Route path="calendar" element={<AdminCalendar />} />
      </Route>

      <Route path="/admin" element={<Navigate to="/head" replace />} />
      <Route path="/admin/*" element={<Navigate to="/head" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

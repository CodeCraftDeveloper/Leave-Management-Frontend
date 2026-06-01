import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiClock, FiCheckCircle, FiXCircle, FiFileText, FiCalendar, FiArrowRight, FiShield } from 'react-icons/fi';
import StatCard from '../../components/StatCard';
import PageHeader from '../../components/PageHeader';
import { ListSkeleton } from '../../components/Skeleton';
import { getDashboard } from '../../services/adminService';
import { fmtDate, statusColors, leaveTypeLabel, leaveTypeColors } from '../../utils/format';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isSuperAdmin } from '../../utils/roles';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatDepartmentScope = (departments = [], fallbackDepartment) => {
  const visibleDepartments = departments.filter(Boolean);
  if (visibleDepartments.length === 1) return `${visibleDepartments[0]} department`;
  if (visibleDepartments.length > 1) return `${visibleDepartments.join(', ')} departments`;
  return fallbackDepartment ? `${fallbackDepartment} department` : 'your department(s)';
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const superAdmin = isSuperAdmin(user);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  const max = data
    ? Math.max(1, ...data.monthly.map((m) => m.pending + m.approved + m.rejected))
    : 1;
  const departmentScope = formatDepartmentScope(data?.scope?.departments, user?.department);
  const dashboardTitle = superAdmin ? 'Super Admin Dashboard' : 'Head Dashboard';
  const dashboardSubtitle = superAdmin
    ? 'Overview of leave activity across all departments'
    : `Overview of leave activity for ${departmentScope}`;

  return (
    <div className="space-y-6">
      <PageHeader title={dashboardTitle} subtitle={dashboardSubtitle} />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title={superAdmin ? 'Employees' : 'Department employees'}
          value={data?.stats?.totalEmployees ?? 0}
          icon={FiUsers}
          accent="blue"
          subtitle={superAdmin ? 'Active workforce' : departmentScope}
        />
        <StatCard title="Pending review" value={data?.stats?.pending ?? 0} icon={FiClock} accent="amber" />
        <StatCard title="Approved leaves" value={data?.stats?.approved ?? 0} icon={FiCheckCircle} accent="emerald" />
        <StatCard title="Rejected leaves" value={data?.stats?.rejected ?? 0} icon={FiXCircle} accent="rose" />
      </section>

      <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
        <WorkspaceLink
          to="/head/leaves"
          icon={FiFileText}
          title="Department requests"
          description={superAdmin
            ? 'Approve, reject, filter, and export routed leave requests.'
            : `Review leave requests from ${departmentScope}.`}
        />
        <WorkspaceLink
          to="/head/employees"
          icon={FiUsers}
          title={superAdmin ? 'Manage department heads' : 'Manage employees'}
          description={superAdmin
            ? 'Manage employees, Head accounts, and approval email routing.'
            : `Add, edit, and review staff assigned to ${departmentScope}.`}
        />
        <WorkspaceLink
          to="/head/calendar"
          icon={FiCalendar}
          title="Department calendar"
          description="Inspect approved leaves, staffing gaps, and holiday overlap by date."
        />
        <WorkspaceLink
          to="/head/leaves?status=approved"
          icon={FiShield}
          title="Department reports"
          description="Export department leave data for payroll and attendance records."
        />
      </section>

      <section className="card p-5">
        <h3 className="font-semibold mb-4">
          Monthly Leave Analytics - {superAdmin ? 'All Departments' : departmentScope} - {new Date().getFullYear()}
        </h3>
        {loading ? (
          <div className="h-48 skeleton" />
        ) : (
          <div className="flex items-end gap-1 sm:gap-3 h-48 overflow-x-auto">
            {data.monthly.map((m, i) => {
              const total = m.pending + m.approved + m.rejected;
              const pct = (v) => (v / max) * 100;
              return (
                <div key={i} className="flex flex-col items-center gap-2 flex-1 min-w-[28px]">
                  <div className="flex flex-col-reverse w-full max-w-[36px] h-40 rounded-lg overflow-hidden bg-surface-container-low">
                    <motion.div initial={{ height: 0 }} animate={{ height: `${pct(m.approved)}%` }} className="bg-emerald-500" />
                    <motion.div initial={{ height: 0 }} animate={{ height: `${pct(m.pending)}%` }} className="bg-amber-500" />
                    <motion.div initial={{ height: 0 }} animate={{ height: `${pct(m.rejected)}%` }} className="bg-rose-500" />
                  </div>
                  <span className="text-[10px] text-on-surface-variant">{monthNames[i]}</span>
                  <span className="text-[10px] text-on-surface-variant/75">{total}</span>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex flex-wrap gap-4 text-xs mt-4">
          <Legend color="bg-emerald-500" label="Approved" />
          <Legend color="bg-amber-500" label="Pending" />
          <Legend color="bg-rose-500" label="Rejected" />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Recent Department Requests</h3>
          <Link to="/head/leaves" className="text-sm text-primary font-semibold hover:underline">View all</Link>
        </div>
        {loading ? (
          <ListSkeleton count={3} />
        ) : (
          <div className="space-y-3">
            {data.recent.length ? data.recent.map((l) => (
              <Link key={l._id} to="/head/leaves" className="card p-4 flex items-center gap-3 hover:shadow-card transition">
                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container border border-outline-variant/50 grid place-items-center font-semibold">
                  {l.employee?.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{l.employee?.name}</p>
                  <p className="text-xs text-on-surface-variant truncate">
                    {l.employee?.employeeId} - {l.employee?.department || 'Unassigned'} - {l.totalDays} days - {fmtDate(l.startDate)}
                  </p>
                </div>
                <div className="flex flex-col gap-1 items-end shrink-0">
                  <span className={`chip ${statusColors[l.status]} capitalize`}>{l.status}</span>
                  <span className={`chip ${leaveTypeColors[l.leaveType]}`}>{leaveTypeLabel[l.leaveType]}</span>
                </div>
              </Link>
            )) : (
              <div className="card p-5 text-sm text-on-surface-variant">
                No recent leave requests for {superAdmin ? 'the organisation' : departmentScope}.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

const Legend = ({ color, label }) => (
  <span className="inline-flex items-center gap-1.5 text-on-surface-variant">
    <span className={`w-3 h-3 rounded-full ${color}`} /> {label}
  </span>
);

const WorkspaceLink = ({ to, icon: Icon, title, description }) => (
  <Link to={to} className="card p-4 group hover:shadow-card transition">
    <div className="flex items-start justify-between gap-3">
      <div className="w-10 h-10 rounded-2xl bg-primary text-on-primary grid place-items-center shrink-0">
        <Icon />
      </div>
      <FiArrowRight className="text-on-surface-variant/40 group-hover:text-primary transition" />
    </div>
    <h3 className="mt-4 text-sm font-semibold">{title}</h3>
    <p className="mt-1 text-xs leading-5 text-on-surface-variant">{description}</p>
  </Link>
);

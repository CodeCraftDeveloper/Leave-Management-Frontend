import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import StatCard from '../../components/StatCard';
import PageHeader from '../../components/PageHeader';
import { ListSkeleton } from '../../components/Skeleton';
import { getDashboard } from '../../services/adminService';
import { fmtDate, statusColors, leaveTypeLabel, leaveTypeColors } from '../../utils/format';
import { Link } from 'react-router-dom';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  const max = data
    ? Math.max(1, ...data.monthly.map((m) => m.pending + m.approved + m.rejected))
    : 1;

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" subtitle="Overview of leave activity" />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Employees" value={data?.stats?.totalEmployees ?? 0} icon={FiUsers} accent="blue" />
        <StatCard title="Pending" value={data?.stats?.pending ?? 0} icon={FiClock} accent="amber" />
        <StatCard title="Approved" value={data?.stats?.approved ?? 0} icon={FiCheckCircle} accent="emerald" />
        <StatCard title="Rejected" value={data?.stats?.rejected ?? 0} icon={FiXCircle} accent="rose" />
      </section>

      <section className="card p-5">
        <h3 className="font-semibold mb-4">Monthly Leave Analytics — {new Date().getFullYear()}</h3>
        {loading ? (
          <div className="h-48 skeleton" />
        ) : (
          <div className="flex items-end gap-1 sm:gap-3 h-48 overflow-x-auto">
            {data.monthly.map((m, i) => {
              const total = m.pending + m.approved + m.rejected;
              const pct = (v) => (v / max) * 100;
              return (
                <div key={i} className="flex flex-col items-center gap-2 flex-1 min-w-[28px]">
                  <div className="flex flex-col-reverse w-full max-w-[36px] h-40 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <motion.div initial={{ height: 0 }} animate={{ height: `${pct(m.approved)}%` }} className="bg-emerald-500" />
                    <motion.div initial={{ height: 0 }} animate={{ height: `${pct(m.pending)}%` }} className="bg-amber-500" />
                    <motion.div initial={{ height: 0 }} animate={{ height: `${pct(m.rejected)}%` }} className="bg-rose-500" />
                  </div>
                  <span className="text-[10px] text-slate-500">{monthNames[i]}</span>
                  <span className="text-[10px] text-slate-400">{total}</span>
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
          <h3 className="font-semibold">Recent Requests</h3>
          <Link to="/admin/leaves" className="text-sm text-primary-600">View all</Link>
        </div>
        {loading ? (
          <ListSkeleton count={3} />
        ) : (
          <div className="space-y-3">
            {data.recent.map((l) => (
              <Link key={l._id} to="/admin/leaves" className="card p-4 flex items-center gap-3 hover:shadow-card transition">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-300 grid place-items-center font-semibold">
                  {l.employee?.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{l.employee?.name}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {l.employee?.employeeId} · {l.totalDays} days · {fmtDate(l.startDate)}
                  </p>
                </div>
                <div className="flex flex-col gap-1 items-end shrink-0">
                  <span className={`chip ${statusColors[l.status]} capitalize`}>{l.status}</span>
                  <span className={`chip ${leaveTypeColors[l.leaveType]}`}>{leaveTypeLabel[l.leaveType]}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const Legend = ({ color, label }) => (
  <span className="inline-flex items-center gap-1.5 text-slate-500">
    <span className={`w-3 h-3 rounded-full ${color}`} /> {label}
  </span>
);

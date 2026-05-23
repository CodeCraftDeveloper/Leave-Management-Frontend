import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCalendar, FiCheckCircle, FiClock, FiXCircle, FiPlusCircle, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { getMySummary } from '../services/leaveService';
import StatCard from '../components/StatCard';
import LeaveCard from '../components/LeaveCard';
import { ListSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { leaveTypeLabel } from '../utils/format';

const balanceAccent = {
  casual: 'blue',
  sick: 'rose',
  emergency: 'amber',
  paid: 'emerald',
  unpaid: 'primary',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMySummary()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="card p-5 sm:p-6 bg-gradient-to-br from-primary-600 to-accent-500 text-white relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <p className="text-sm/relaxed text-white/80">Welcome back</p>
        <h2 className="text-2xl sm:text-3xl font-bold mt-0.5">{user?.name} 👋</h2>
        <p className="mt-1 text-white/80 text-sm">
          {user?.designation} · {user?.department}
        </p>
        <Link to="/apply" className="inline-flex items-center gap-2 mt-4 bg-white text-primary-700 font-semibold px-4 py-2 rounded-xl shadow-card hover:opacity-95">
          <FiPlusCircle /> Apply Leave
        </Link>
      </motion.div>

      <section>
        <h3 className="font-semibold mb-3">Leave Balance</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(user?.leaveBalance || {}).map(([k, v]) => (
            <div key={k} className="card p-4">
              <p className="text-xs text-slate-500">{leaveTypeLabel[k]}</p>
              <p className="text-2xl font-bold mt-1">{v}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">days remaining</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Pending" value={data?.counts?.pending ?? 0} icon={FiClock} accent="amber" />
        <StatCard title="Approved" value={data?.counts?.approved ?? 0} icon={FiCheckCircle} accent="emerald" />
        <StatCard title="Rejected" value={data?.counts?.rejected ?? 0} icon={FiXCircle} accent="rose" />
        <StatCard title="Cancelled" value={data?.counts?.cancelled ?? 0} icon={FiCalendar} accent="primary" />
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Upcoming Leaves</h3>
          <Link to="/calendar" className="text-sm text-primary-600 inline-flex items-center gap-1">
            View calendar <FiArrowRight />
          </Link>
        </div>
        {loading ? (
          <ListSkeleton count={2} />
        ) : data?.upcoming?.length ? (
          <div className="space-y-3">
            {data.upcoming.map((l) => <LeaveCard key={l._id} leave={l} />)}
          </div>
        ) : (
          <EmptyState title="No upcoming leaves" subtitle="Plan ahead — apply a leave anytime." />
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Recent Requests</h3>
          <Link to="/history" className="text-sm text-primary-600 inline-flex items-center gap-1">
            See all <FiArrowRight />
          </Link>
        </div>
        {loading ? (
          <ListSkeleton count={3} />
        ) : data?.recent?.length ? (
          <div className="space-y-3">
            {data.recent.map((l) => <LeaveCard key={l._id} leave={l} />)}
          </div>
        ) : (
          <EmptyState title="No leave history yet" subtitle="Your applied leaves will appear here." />
        )}
      </section>
    </div>
  );
}

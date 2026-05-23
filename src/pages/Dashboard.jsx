import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getMyLeaves, getHolidays } from '../services/leaveService';
import ApplyLeaveModal from '../components/ApplyLeaveModal';

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const toIsoDate = (d) => {
  const x = startOfDay(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const loadLeaves = () =>
    getMyLeaves({ limit: 100 }).then((d) => setLeaves(d.items)).catch(() => {});

  useEffect(() => {
    loadLeaves();
    getHolidays().then(setHolidays).catch(() => {});
  }, []);

  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const activeLeaves = leaves.filter(
      (l) => l.status === 'approved' || l.status === 'pending'
    );

    const monthLeavesTaken = activeLeaves.reduce((sum, l) => {
      const s = startOfDay(l.startDate);
      const e = startOfDay(l.endDate);
      if (e < monthStart || s > monthEnd) return sum;
      return sum + (l.totalDays || 0);
    }, 0);

    const upcomingLeavesCount = activeLeaves.filter(
      (l) => startOfDay(l.startDate) >= today
    ).length;

    const upcomingHolidaysCount = holidays.filter(
      (h) => startOfDay(h.date) >= today
    ).length;

    return { monthLeavesTaken, upcomingLeavesCount, upcomingHolidaysCount };
  }, [leaves, holidays]);

  const upcomingHolidaysList = useMemo(() => {
    const today = startOfDay(new Date());
    return holidays
      .filter((h) => startOfDay(h.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 2);
  }, [holidays]);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning,';
    if (hr < 18) return 'Good afternoon,';
    return 'Good evening,';
  };

  const handleQuickApply = () => {
    setSelectedDate(toIsoDate(new Date()));
    setModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      {/* Greeting Section */}
      <motion.section
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="pt-2"
      >
        <p className="text-body-md text-on-surface-variant font-medium mb-1">{getGreeting()}</p>
        <h1 className="text-3xl font-bold text-primary tracking-tight">
          Welcome back,<br />{user?.name || 'Employee'} 👋
        </h1>
      </motion.section>

      {/* Quick Stats Grid */}
      <section className="grid grid-cols-2 gap-4">
        {/* This Month */}
        <div className="col-span-2 bg-surface-container-lowest dark:bg-slate-900 rounded-xl p-5 shadow-[0px_4px_20px_rgba(27,43,72,0.05)] border border-outline-variant/40 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-on-surface-variant mb-1">This Month</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-primary dark:text-slate-200">{stats.monthLeavesTaken}</span>
              <span className="text-body-md text-on-surface-variant">
                {stats.monthLeavesTaken === 1 ? 'leave taken' : 'leaves taken'}
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary shadow-sm border border-outline-variant/10">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
          </div>
        </div>

        {/* Upcoming */}
        <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-xl p-5 shadow-[0px_4px_20px_rgba(27,43,72,0.05)] border border-outline-variant/40 flex flex-col gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary shadow-sm">
            <span className="material-symbols-outlined text-lg">flight_takeoff</span>
          </div>
          <div>
            <span className="text-xl font-bold text-primary dark:text-slate-200 block">
              {stats.upcomingLeavesCount} planned
            </span>
            <span className="text-xs font-medium text-on-surface-variant">Upcoming</span>
          </div>
        </div>

        {/* Holidays */}
        <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-xl p-5 shadow-[0px_4px_20px_rgba(27,43,72,0.05)] border border-outline-variant/40 flex flex-col gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-fixed-dim flex items-center justify-center text-primary shadow-sm">
            <span className="material-symbols-outlined text-lg">celebration</span>
          </div>
          <div>
            <span className="text-xl font-bold text-primary dark:text-slate-200 block">
              {stats.upcomingHolidaysCount} coming up
            </span>
            <span className="text-xs font-medium text-on-surface-variant">Holidays</span>
          </div>
        </div>
      </section>

      {/* Quick Apply Section */}
      <section className="bg-surface-container-lowest dark:bg-slate-900 rounded-xl shadow-[0px_4px_20px_rgba(27,43,72,0.05)] border border-outline-variant/40 overflow-hidden relative">
        {/* Decorative background pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-fixed rounded-bl-full opacity-50 -z-0 pointer-events-none" />
        <div className="p-6 relative z-10 flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-bold text-primary dark:text-slate-200 mb-1">Need some time off?</h2>
            <p className="text-body-md text-on-surface-variant">
              Submit your leave request quickly and get back to what matters.
            </p>
          </div>
          <button
            onClick={handleQuickApply}
            className="bg-secondary text-on-secondary font-semibold h-12 px-6 rounded-lg w-full flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-md hover:bg-secondary/95"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Quick Apply
          </button>
        </div>
      </section>

      {/* Upcoming Holidays Preview */}
      <section className="bg-surface-container-lowest dark:bg-slate-900 rounded-xl shadow-[0px_4px_20px_rgba(27,43,72,0.05)] border border-outline-variant/40 overflow-hidden">
        <div className="bg-surface-container-high dark:bg-slate-800 px-5 py-3.5 border-b border-outline-variant/40 flex justify-between items-center">
          <h3 className="text-sm font-bold text-primary dark:text-slate-200">Upcoming Holidays</h3>
          <Link
            to="/calendar"
            className="text-primary dark:text-slate-300 font-semibold text-xs hover:underline flex items-center gap-1"
          >
            View All <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
          </Link>
        </div>
        <ul className="flex flex-col divide-y divide-outline-variant/20">
          {upcomingHolidaysList.length === 0 ? (
            <li className="px-5 py-4 text-center text-sm text-on-surface-variant">
              No upcoming holidays.
            </li>
          ) : (
            upcomingHolidaysList.map((h) => {
              const hDate = new Date(h.date);
              const mName = hDate.toLocaleDateString('en-US', { month: 'short' });
              const dNum = hDate.toLocaleDateString('en-US', { day: 'numeric' });
              return (
                <li key={h._id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex flex-col items-center justify-center text-primary border border-outline-variant/10 shrink-0">
                      <span className="text-[10px] font-bold uppercase leading-tight">{mName}</span>
                      <span className="text-base font-bold leading-none">{dNum}</span>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-on-background dark:text-slate-200 block">{h.name}</span>
                      {h.description && (
                        <span className="text-xs text-on-surface-variant block">{h.description}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-on-surface-variant bg-surface-container-low px-2 py-1 rounded border border-outline-variant/20">
                    {h.type || 'Holiday'}
                  </span>
                </li>
              );
            })
          )}
        </ul>
      </section>

      {/* Apply Leave Modal */}
      <ApplyLeaveModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultDate={selectedDate}
        onSuccess={loadLeaves}
      />
    </div>
  );
}

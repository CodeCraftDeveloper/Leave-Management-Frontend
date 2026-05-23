import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiCalendar, FiClock, FiGift } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getMyLeaves, getHolidays } from '../services/leaveService';
import ApplyLeaveModal from '../components/ApplyLeaveModal';
import MonthCalendar from '../components/MonthCalendar';
import { leaveTypeLabel } from '../utils/format';

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
  const [leaves, setLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [month, setMonth] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const loadLeaves = () =>
    getMyLeaves({ limit: 100 }).then((d) => setLeaves(d.items)).catch(() => {});

  useEffect(() => {
    loadLeaves();
    getHolidays().then(setHolidays).catch(() => {});
  }, []);

  const events = useMemo(() => {
    const holidayEvents = holidays.map((h) => ({
      id: 'h-' + h._id,
      title: h.name,
      startDate: h.date,
      endDate: h.date,
      kind: 'holiday',
    }));
    const leaveEvents = leaves
      .filter((l) => l.status !== 'cancelled')
      .map((l) => ({
        id: 'l-' + l._id,
        title: leaveTypeLabel[l.leaveType] || 'Leave',
        startDate: l.startDate,
        endDate: l.endDate,
        kind: 'leave-' + l.status,
        data: l,
      }));
    return [...holidayEvents, ...leaveEvents];
  }, [holidays, leaves]);

  const upcomingHolidays = useMemo(() => {
    const today = startOfDay(new Date());
    return holidays
      .filter((h) => startOfDay(h.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3);
  }, [holidays]);

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

  const handleClickDay = (date, eventsOnDay) => {
    if (eventsOnDay.some((e) => e.kind === 'holiday')) {
      toast('This is a company holiday — no leave needed.', { icon: '🎉' });
      return;
    }
    if (eventsOnDay.some((e) => e.kind === 'leave-approved' || e.kind === 'leave-pending')) {
      toast('You already have a leave on this date.', { icon: 'ℹ️' });
      return;
    }
    setSelectedDate(toIsoDate(date));
    setModalOpen(true);
  };

  const overviewCards = [
    {
      label: 'This Month',
      value: stats.monthLeavesTaken,
      caption: 'leaves taken',
      icon: FiCalendar,
      tone: 'text-sky-600 bg-sky-50 dark:text-sky-300 dark:bg-sky-500/10',
    },
    {
      label: 'Upcoming',
      value: stats.upcomingLeavesCount,
      caption: 'leaves planned',
      icon: FiClock,
      tone: 'text-violet-600 bg-violet-50 dark:text-violet-300 dark:bg-violet-500/10',
    },
    {
      label: 'Holidays',
      value: stats.upcomingHolidaysCount,
      caption: 'coming up',
      icon: FiGift,
      tone: 'text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/10',
    },
  ];

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
        <p className="mt-3 text-white/90 text-sm">
          Tap any date on the calendar below to request a leave.
        </p>
      </motion.div>

      <section>
        <h3 className="font-semibold mb-3">Overview</h3>
        <div className="grid grid-cols-3 gap-3">
          {overviewCards.map(({ label, value, caption, icon: Icon, tone }) => (
            <div
              key={label}
              className="card min-h-[8rem] p-3 min-w-0 flex flex-col justify-between"
            >
              <div>
                <span className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 ${tone}`}>
                  <Icon className="text-sm" />
                </span>
                <span className="mt-2 block text-[11px] sm:text-xs font-semibold leading-tight text-slate-800 dark:text-white">
                  {label}
                </span>
              </div>
              <div>
                <span className="block text-2xl font-bold leading-none text-slate-900 dark:text-white">
                  {value}
                </span>
                <span className="mt-2 block text-[11px] leading-tight text-slate-600 dark:text-slate-300">
                  {caption}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <motion.section
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="card p-4"
      >
        <MonthCalendar
          events={events}
          month={month}
          onChangeMonth={setMonth}
          onClickDay={handleClickDay}
          disablePastDays
        />
      </motion.section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Upcoming Holidays</h3>
          <Link to="/calendar" className="text-sm text-primary-600 inline-flex items-center gap-1">
            View all <FiArrowRight />
          </Link>
        </div>
        <div className="card p-4 space-y-3">
          {upcomingHolidays.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-2">No upcoming holidays.</p>
          ) : (
            upcomingHolidays.map((h) => (
              <div key={h._id} className="flex justify-between items-center py-1">
                <div>
                  <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{h.name}</h4>
                  <p className="text-xs text-slate-500">{h.description || 'Company Holiday'}</p>
                </div>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1.5 rounded-lg shrink-0">
                  {new Date(h.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <ApplyLeaveModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultDate={selectedDate}
        onSuccess={loadLeaves}
      />
    </div>
  );
}

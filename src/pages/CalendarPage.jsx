import { useEffect, useState, useMemo } from 'react';
import Calendar from 'react-calendar';
import { motion } from 'framer-motion';
import PageHeader from '../components/PageHeader';
import { getMyLeaves, getHolidays } from '../services/leaveService';
import LeaveCard from '../components/LeaveCard';
import { ListSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

export default function CalendarPage() {
  const [leaves, setLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    Promise.all([
      getMyLeaves({ limit: 100 }),
      getHolidays()
    ])
      .then(([leavesData, holidaysData]) => {
        setLeaves(leavesData.items);
        setHolidays(holidaysData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const leaveByDate = useMemo(() => {
    const map = new Map();
    leaves.forEach((l) => {
      if (l.status === 'cancelled') return;
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toDateString();
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(l);
      }
    });
    return map;
  }, [leaves]);

  const holidaysByDate = useMemo(() => {
    const map = new Map();
    holidays.forEach((h) => {
      const key = new Date(h.date).toDateString();
      map.set(key, h);
    });
    return map;
  }, [holidays]);

  const tileClassName = ({ date }) => {
    const dateStr = date.toDateString();
    
    // Check if it is an official holiday first
    if (holidaysByDate.has(dateStr)) return 'holiday-day';

    const items = leaveByDate.get(dateStr);
    if (!items?.length) return '';
    const top = items[0].status;
    if (top === 'approved') return 'leave-day';
    if (top === 'pending') return 'leave-day-pending';
    if (top === 'rejected') return 'leave-day-rejected';
    return '';
  };

  const selectedLeaves = leaveByDate.get(date.toDateString()) || [];
  const selectedHoliday = holidaysByDate.get(date.toDateString());

  return (
    <div className="space-y-5">
      <PageHeader title="Leave Calendar" subtitle="Visualise all your leaves and official holidays" />
      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="card p-4">
        <Calendar onChange={setDate} value={date} tileClassName={tileClassName} />
        <div className="flex flex-wrap gap-3 mt-3 text-xs">
          <Legend color="bg-emerald-400" label="Approved" />
          <Legend color="bg-amber-400" label="Pending" />
          <Legend color="bg-rose-400" label="Rejected" />
          <Legend color="bg-indigo-400 border border-dashed border-indigo-600" label="Official Holiday" />
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <h3 className="font-semibold mb-3">
            Events on {date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </h3>
          {selectedHoliday && (
            <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 p-4 rounded-2xl flex items-start gap-3.5 mb-3 text-indigo-900 dark:text-indigo-200">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900 grid place-items-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                H
              </div>
              <div>
                <h4 className="font-bold text-base">{selectedHoliday.name}</h4>
                <p className="text-sm text-indigo-700/80 dark:text-indigo-300/80 mt-0.5">{selectedHoliday.description || 'Official Company Holiday'}</p>
              </div>
            </div>
          )}
          {loading ? (
            <ListSkeleton count={2} />
          ) : selectedLeaves.length === 0 && !selectedHoliday ? (
            <EmptyState title="No leaves or holidays on this day" />
          ) : (
            <div className="space-y-3">
              {selectedLeaves.map((l) => <LeaveCard key={l._id} leave={l} />)}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-semibold mb-3">Company Holiday List</h3>
          <div className="card p-4 space-y-3 max-h-[350px] overflow-y-auto">
            {holidays.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No official holidays added yet.</p>
            ) : (
              holidays.map((h) => (
                <div key={h._id} className="flex justify-between items-center py-2.5 border-b last:border-b-0 border-slate-100 dark:border-slate-800">
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
        </div>
      </div>
    </div>
  );
}

const Legend = ({ color, label }) => (
  <span className="inline-flex items-center gap-1.5">
    <span className={`w-3 h-3 rounded-full ${color}`} /> {label}
  </span>
);

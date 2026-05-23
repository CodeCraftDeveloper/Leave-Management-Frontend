import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '../components/PageHeader';
import MonthCalendar from '../components/MonthCalendar';
import { getMyLeaves, getHolidays } from '../services/leaveService';
import LeaveCard from '../components/LeaveCard';
import { ListSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { leaveTypeLabel, statusColors } from '../utils/format';

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const daysBetween = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / 86_400_000);

export default function CalendarPage() {
  const [leaves, setLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tab, setTab] = useState('upcoming');

  useEffect(() => {
    Promise.all([getMyLeaves({ limit: 100 }), getHolidays()])
      .then(([leavesData, holidaysData]) => {
        setLeaves(leavesData.items);
        setHolidays(holidaysData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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

  const leaveByDate = useMemo(() => {
    const map = new Map();
    leaves.forEach((l) => {
      if (l.status === 'cancelled') return;
      const start = startOfDay(l.startDate);
      const end = startOfDay(l.endDate);
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
    holidays.forEach((h) => map.set(startOfDay(h.date).toDateString(), h));
    return map;
  }, [holidays]);

  const handleClickDay = (date) => setSelectedDate(date);

  const selectedLeaves = leaveByDate.get(selectedDate.toDateString()) || [];
  const selectedHoliday = holidaysByDate.get(selectedDate.toDateString());

  const { upcomingItems, pastItems, stats } = useMemo(() => {
    const today = startOfDay(new Date());
    const items = [];

    holidays.forEach((h) => {
      items.push({
        id: 'h-' + h._id,
        kind: 'holiday',
        title: h.name,
        subtitle: h.description || 'Company Holiday',
        date: startOfDay(h.date),
      });
    });

    leaves.forEach((l) => {
      if (l.status === 'cancelled') return;
      const start = startOfDay(l.startDate);
      const end = startOfDay(l.endDate);
      const days = daysBetween(start, end) + 1;
      items.push({
        id: 'l-' + l._id,
        kind: 'leave',
        title: (leaveTypeLabel[l.leaveType] || 'Leave') + ' Leave',
        subtitle: `${days} day${days > 1 ? 's' : ''} · ${l.reason || 'No reason provided'}`,
        date: start,
        end,
        status: l.status,
      });
    });

    const upcoming = items.filter((i) => i.date >= today).sort((a, b) => a.date - b.date);
    const past = items.filter((i) => i.date < today).sort((a, b) => b.date - a.date);

    const year = today.getFullYear();
    const approvedDaysThisYear = leaves
      .filter((l) => l.status === 'approved' && new Date(l.startDate).getFullYear() === year)
      .reduce((sum, l) => sum + daysBetween(l.startDate, l.endDate) + 1, 0);
    const pendingCount = leaves.filter((l) => l.status === 'pending').length;
    const upcomingHolidays = holidays.filter((h) => startOfDay(h.date) >= today).length;

    return {
      upcomingItems: upcoming,
      pastItems: past,
      stats: { approvedDaysThisYear, pendingCount, upcomingHolidays, year },
    };
  }, [leaves, holidays]);

  const tabItems = tab === 'upcoming' ? upcomingItems : pastItems;

  return (
    <div className="space-y-5">
      <PageHeader title="Leave Calendar" subtitle="Visualise all your leaves and official holidays" />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Leave days taken in {stats.year}</p>
          <p className="text-2xl font-bold mt-1 text-slate-800 dark:text-slate-100">{stats.approvedDaysThisYear}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Pending requests</p>
          <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{stats.pendingCount}</p>
        </div>
        <div className="card p-4 col-span-2 md:col-span-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">Upcoming holidays</p>
          <p className="text-2xl font-bold mt-1 text-indigo-600 dark:text-indigo-400">{stats.upcomingHolidays}</p>
        </div>
      </div>

      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="card p-4">
        <MonthCalendar
          events={events}
          month={month}
          onChangeMonth={setMonth}
          onClickDay={handleClickDay}
        />
      </motion.div>

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <h3 className="font-semibold mb-3">
            Events on {selectedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
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
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Leave History &amp; Holidays</h3>
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setTab('upcoming')}
                className={[
                  'px-3 py-1.5 rounded-md font-medium transition',
                  tab === 'upcoming'
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
                ].join(' ')}
              >
                Upcoming ({upcomingItems.length})
              </button>
              <button
                type="button"
                onClick={() => setTab('past')}
                className={[
                  'px-3 py-1.5 rounded-md font-medium transition',
                  tab === 'past'
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
                ].join(' ')}
              >
                Past ({pastItems.length})
              </button>
            </div>
          </div>
          <div className="card p-4 space-y-2 max-h-[350px] overflow-y-auto">
            {tabItems.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                {tab === 'upcoming' ? 'Nothing on the horizon.' : 'No past leaves or holidays yet.'}
              </p>
            ) : (
              tabItems.map((item) => (
                <div key={item.id} className="flex justify-between items-start gap-3 py-2.5 border-b last:border-b-0 border-slate-100 dark:border-slate-800">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={[
                      'w-9 h-9 rounded-lg grid place-items-center text-xs font-bold shrink-0',
                      item.kind === 'holiday'
                        ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300'
                        : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300',
                    ].join(' ')}>
                      {item.kind === 'holiday' ? 'H' : 'L'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{item.title}</h4>
                      <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
                      {item.kind === 'leave' && (
                        <span className={['inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full', statusColors[item.status]].join(' ')}>
                          {item.status}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg shrink-0">
                    {item.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
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

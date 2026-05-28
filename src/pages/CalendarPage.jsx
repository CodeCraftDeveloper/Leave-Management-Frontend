import { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import MonthCalendar from '../components/MonthCalendar';
import { getMyLeaves, getHolidays, cancelLeave } from '../services/leaveService';
import LeaveCard from '../components/LeaveCard';
import { ListSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { leaveTypeLabel, statusColors, fmtDate } from '../utils/format';
import { startOfDay as dateFnsStartOfDay, parseISO } from 'date-fns';

const parseDate = (d) => {
  if (!d) return new Date();
  if (d instanceof Date) return d;
  return parseISO(d);
};

const startOfDay = (d) => dateFnsStartOfDay(parseDate(d));

const statusOptions = ['all', 'pending', 'approved', 'rejected', 'cancelled'];

const leaveTypeColors = {
  sick: 'bg-rose-100 text-rose-800',
  casual: 'bg-blue-100 text-blue-800',
  personal: 'bg-indigo-100 text-indigo-800',
  emergency: 'bg-amber-100 text-amber-800',
  paid: 'bg-emerald-100 text-emerald-800',
  unpaid: 'bg-surface-container-high text-on-surface-variant border border-outline-variant/35',
};

export default function CalendarPage() {
  const [searchParams] = useSearchParams();
  const historyRef = useRef(null);

  const [leaves, setLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // History list states
  const [historyTab, setHistoryTab] = useState('upcoming');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedLeave, setSelectedLeave] = useState(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([getMyLeaves({ limit: 100 }), getHolidays()])
      .then(([leavesData, holidaysData]) => {
        setLeaves(leavesData.items);
        setHolidays(holidaysData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Smooth scroll to history if targeted in URL query
  useEffect(() => {
    if (searchParams.get('tab') === 'history' && historyRef.current) {
      setTimeout(() => {
        historyRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [searchParams, loading]);

  const onCancel = async (id) => {
    if (!confirm('Cancel this leave request?')) return;
    try {
      await cancelLeave(id);
      toast.success('Leave cancelled successfully');
      setSelectedLeave(null);
      loadData();
    } catch {}
  };

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

  const handleClickDay = (date) => {
    setSelectedDate(date);
  };

  const { selectedLeaves, selectedHoliday } = useMemo(() => {
    const dayKey = startOfDay(selectedDate);
    const dayKeyMs = dayKey.getTime();

    const leavesOnDay = leaves.filter((l) => {
      if (l.status === 'cancelled') return false;
      const s = startOfDay(l.startDate);
      const en = startOfDay(l.endDate);
      return s.getTime() <= dayKeyMs && dayKeyMs <= en.getTime();
    });

    const holidayOnDay = holidays.find((h) => {
      const d = startOfDay(h.date);
      return d.getTime() === dayKeyMs;
    });

    return { selectedLeaves: leavesOnDay, selectedHoliday: holidayOnDay };
  }, [selectedDate, leaves, holidays]);

  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const year = today.getFullYear();
    const approvedDaysThisYear = leaves
      .filter((l) => l.status === 'approved' && new Date(l.startDate).getFullYear() === year)
      .reduce((sum, l) => {
        const totalDays = Number(l.totalDays);
        if (Number.isFinite(totalDays)) return sum + totalDays;
        return sum + (l.isHalfDay ? 0.5 : 1);
      }, 0);
    const pendingCount = leaves.filter((l) => l.status === 'pending').length;
    const upcomingHolidays = holidays.filter((h) => startOfDay(h.date) >= today).length;

    return { approvedDaysThisYear, pendingCount, upcomingHolidays, year };
  }, [leaves, holidays]);

  // History filtering
  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      const matchSearch =
        l.reason?.toLowerCase().includes(search.toLowerCase()) ||
        leaveTypeLabel[l.leaveType]?.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === 'all' || l.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [leaves, search, statusFilter]);

  const processedHistory = useMemo(() => {
    const today = startOfDay(new Date());
    const upcoming = filteredLeaves.filter((l) => startOfDay(l.startDate) >= today);
    const past = filteredLeaves.filter((l) => startOfDay(l.startDate) < today);

    upcoming.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    past.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

    return { upcoming, past };
  }, [filteredLeaves]);

  const activeLeaves = historyTab === 'upcoming' ? processedHistory.upcoming : processedHistory.past;

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16 overflow-hidden">
      <PageHeader title="Leave Calendar" subtitle="Plan and track your time off" />

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card rounded-2xl px-3 py-3 min-h-[92px] flex flex-col justify-between">
          <p className="text-[11px] leading-tight text-on-surface-variant font-medium">Leave days taken in {stats.year}</p>
          <p className="text-xl leading-none font-bold text-primary">{stats.approvedDaysThisYear}</p>
        </div>
        <div className="card rounded-2xl px-3 py-3 min-h-[92px] flex flex-col justify-between">
          <p className="text-[11px] leading-tight text-on-surface-variant font-medium">Pending requests</p>
          <p className="text-xl leading-none font-bold text-amber-600">{stats.pendingCount}</p>
        </div>
        <div className="card rounded-2xl px-3 py-3 min-h-[92px] flex flex-col justify-between">
          <p className="text-[11px] leading-tight text-on-surface-variant font-medium">Upcoming holidays</p>
          <p className="text-xl leading-none font-bold text-indigo-600">{stats.upcomingHolidays}</p>
        </div>
      </div>

      {/* Calendar Card */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="card p-4 overflow-hidden"
      >
        <MonthCalendar
          events={events}
          month={month}
          onChangeMonth={setMonth}
          onClickDay={handleClickDay}
          selectedDate={selectedDate}
        />
      </motion.div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span className="text-xs font-semibold text-on-surface-variant">Personal Leave</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-error-container border border-error/20"></div>
          <span className="text-xs font-semibold text-on-surface-variant">Public Holiday</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full border border-outline-variant bg-surface-container-lowest"></div>
          <span className="text-xs font-semibold text-on-surface-variant">Working Day</span>
        </div>
      </div>

      {/* Selected Date Events */}
      <div className="card p-4 space-y-3">
        <h3 className="font-bold text-headline-sm text-primary">
          Events on {selectedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
        </h3>
        
        {selectedHoliday && (
          <div className="bg-error-container text-on-error-container p-4 rounded-xl flex items-start gap-3 border border-error/10">
            <div className="w-10 h-10 rounded-full bg-error text-on-error flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-lg">celebration</span>
            </div>
            <div>
              <h4 className="font-bold text-base">{selectedHoliday.name}</h4>
              <p className="text-xs text-on-error-container/85 mt-0.5">{selectedHoliday.description || 'Official Company Holiday'}</p>
            </div>
          </div>
        )}

        {selectedLeaves.length > 0 && (
          <div className="space-y-3">
            {selectedLeaves.map((l) => (
              <div key={l._id} className="bg-surface-container-low border border-outline-variant/20 p-4 rounded-xl flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-lg">flight_takeoff</span>
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h4 className="font-bold text-sm text-on-surface truncate">
                      {leaveTypeLabel[l.leaveType]}
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusColors[l.status]}`}>
                      {l.status}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant font-medium">
                    {l.isHalfDay ? 'Half Day' : 'Full Day'} • {fmtDate(l.startDate, 'dd MMM')} - {fmtDate(l.endDate, 'dd MMM')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedLeaves.length === 0 && !selectedHoliday && (
          <p className="text-sm text-on-surface-variant italic text-center py-4">No leaves or holidays scheduled for this date.</p>
        )}
      </div>

      {/* LEAVE HISTORY SECTION */}
      <div ref={historyRef} className="pt-6 border-t border-outline-variant/30 space-y-4">
        {/* Header & Controls */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-bold text-headline-sm text-primary">Leave History</h2>
            <p className="text-xs text-on-surface-variant">Review your upcoming and past leave requests.</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`h-10 px-4 rounded-lg border border-outline-variant flex items-center gap-1 hover:bg-surface-container-low transition-colors font-semibold text-xs text-on-surface ${
              showFilters ? 'bg-surface-container-low border-primary/45' : ''
            }`}
          >
            <span className="material-symbols-outlined text-base">filter_list</span>
            Filter
          </button>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-surface-container-low rounded-xl border border-outline-variant/35 shadow-sm"
            >
              <div className="p-4 space-y-4">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50">search</span>
                  <input
                    placeholder="Search by reason or leave type..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-2 focus:border-primary focus:ring-0 transition placeholder:text-on-surface-variant/40"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-primary">Status Filter</label>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {statusOptions.map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition ${
                          statusFilter === s
                            ? 'bg-primary text-on-primary shadow-sm'
                            : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex p-1 bg-surface-container-low rounded-xl">
          <button
            onClick={() => setHistoryTab('upcoming')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              historyTab === 'upcoming'
                ? 'bg-white text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setHistoryTab('past')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              historyTab === 'past'
                ? 'bg-white text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Past
          </button>
        </div>

        {/* History Leaves List */}
        {loading ? (
          <ListSkeleton count={2} />
        ) : activeLeaves.length === 0 ? (
          <EmptyState title="No leaves found" subtitle="Try adjusting your filters or tab criteria" />
        ) : (
          <div className="space-y-4">
            {activeLeaves.map((l) => (
              <LeaveCard
                key={l._id}
                leave={l}
                onClick={() => setSelectedLeave(l)}
                onCancel={onCancel}
              />
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      <Modal
        open={!!selectedLeave}
        onClose={() => setSelectedLeave(null)}
        title="Leave Details"
        footer={
          selectedLeave?.status === 'pending' && (
            <button
              onClick={() => onCancel(selectedLeave._id)}
              className="bg-secondary text-on-secondary font-semibold h-11 px-5 rounded-lg hover:bg-secondary/90 flex items-center justify-center gap-1.5 transition-colors shadow-sm w-full"
            >
              <span className="material-symbols-outlined text-base">close</span> Cancel Leave
            </button>
          )
        }
      >
        {selectedLeave && (
          <div className="space-y-4 text-sm font-medium">
            <div className="flex flex-wrap gap-2 pt-1">
              <span className={`chip ${leaveTypeColors[selectedLeave.leaveType] || ''}`}>
                {leaveTypeLabel[selectedLeave.leaveType]}
              </span>
              <span className={`chip uppercase font-semibold tracking-wider ${statusColors[selectedLeave.status] || ''}`}>
                {selectedLeave.status}
              </span>
            </div>
            
            <div className="divide-y divide-outline-variant/20 border-t border-b border-outline-variant/20 py-1">
              <div className="flex justify-between py-2.5">
                <span className="text-on-surface-variant font-medium">Start Date</span>
                <span className="font-semibold text-primary">{fmtDate(selectedLeave.startDate, 'dd MMM yyyy')}</span>
              </div>
              {selectedLeave.isHalfDay ? (
                <div className="flex justify-between py-2.5">
                  <span className="text-on-surface-variant font-medium">Session</span>
                  <span className="font-semibold text-primary">
                    {selectedLeave.halfDaySession === 'first_half' ? 'First Half (Morning)' : 'Second Half (Afternoon)'}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between py-2.5">
                  <span className="text-on-surface-variant font-medium">End Date</span>
                  <span className="font-semibold text-primary">{fmtDate(selectedLeave.endDate, 'dd MMM yyyy')}</span>
                </div>
              )}
              <div className="flex justify-between py-2.5">
                <span className="text-on-surface-variant font-medium">Total Days</span>
                <span className="font-semibold text-primary">{selectedLeave.totalDays} Day(s)</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-on-surface-variant font-medium">Applied On</span>
                <span className="font-semibold text-primary">{fmtDate(selectedLeave.createdAt, 'dd MMM yyyy, p')}</span>
              </div>
              {selectedLeave.actionedAt && (
                <div className="flex justify-between py-2.5">
                  <span className="text-on-surface-variant font-medium">Actioned On</span>
                  <span className="font-semibold text-primary">{fmtDate(selectedLeave.actionedAt, 'dd MMM yyyy, p')}</span>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-base">info</span> Reason
              </p>
              <p className="mt-1 text-on-surface bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/10 text-body-md font-normal leading-relaxed">
                {selectedLeave.reason || 'No description provided.'}
              </p>
            </div>

            {selectedLeave.adminComment && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Manager's Comment</p>
                <p className="mt-1 text-on-surface bg-[#fffbeb] p-3.5 rounded-xl border border-amber-200/50 text-body-md font-normal leading-relaxed">
                  {selectedLeave.adminComment}
                </p>
              </div>
            )}
            
            {selectedLeave.attachment && (
              <a
                href={selectedLeave.attachment}
                target="_blank"
                rel="noreferrer"
                className="w-full h-11 border border-outline-variant text-primary hover:bg-surface-container-low font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors mt-2"
              >
                View Attachment
              </a>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiSearch, FiFilter, FiX, FiInfo } from 'react-icons/fi';
import { getMyLeaves, cancelLeave } from '../services/leaveService';
import LeaveCard from '../components/LeaveCard';
import { ListSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { fmtDate, leaveTypeLabel, leaveTypeColors } from '../utils/format';

const statusColors = {
  approved: 'bg-[#dcfce7] text-[#166534]',
  pending: 'bg-surface-container-high text-[#92400e] border border-outline-variant/30',
  rejected: 'bg-rose-100 text-rose-800',
  cancelled: 'bg-surface-container-high text-on-surface-variant border border-outline-variant/30',
};

const statusOptions = ['all', 'pending', 'approved', 'rejected', 'cancelled'];

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export default function LeaveHistory() {
  const [tab, setTab] = useState('upcoming'); // 'upcoming' or 'past'
  const [showFilters, setShowFilters] = useState(false);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [data, setData] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = () => {
    setLoading(true);
    getMyLeaves({ status: status === 'all' ? undefined : status, limit: 50 })
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(load, [status]);

  const onCancel = async (id) => {
    if (!confirm('Cancel this leave request?')) return;
    try {
      await cancelLeave(id);
      toast.success('Leave cancelled successfully');
      setSelected(null);
      load();
    } catch {}
  };

  const processedLeaves = useMemo(() => {
    const today = startOfDay(new Date());
    
    // First filter by search keyword
    const filteredBySearch = data.items.filter((l) =>
      l.reason?.toLowerCase().includes(search.toLowerCase()) ||
      leaveTypeLabel[l.leaveType]?.toLowerCase().includes(search.toLowerCase())
    );

    // Split into upcoming and past
    const upcoming = filteredBySearch.filter((l) => startOfDay(l.startDate) >= today);
    const past = filteredBySearch.filter((l) => startOfDay(l.startDate) < today);

    // Sort upcoming ascending, past descending
    upcoming.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    past.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

    return { upcoming, past };
  }, [data.items, search]);

  const activeLeaves = tab === 'upcoming' ? processedLeaves.upcoming : processedLeaves.past;

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      {/* Header and Controls */}
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-1">Leave History</h1>
          <p className="text-body-md text-on-surface-variant">Review your upcoming and past leave requests.</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`h-10 px-4 rounded-lg border border-outline-variant flex items-center gap-2 hover:bg-surface-container-low transition-colors font-semibold text-xs text-on-surface ${
            showFilters ? 'bg-surface-container-low border-primary/40' : ''
          }`}
        >
          <FiFilter className="text-sm" />
          Filter
        </button>
      </div>

      {/* Toggleable Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-surface-container-low rounded-xl border border-outline-variant/30 shadow-sm"
          >
            <div className="p-4 space-y-4">
              <div className="relative">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                <input
                  placeholder="Search by reason or leave type..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-10 h-10 py-2"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-primary">Status Filter</label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {statusOptions.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition ${
                        status === s
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
      <div className="flex p-1 bg-surface-container-low border border-outline-variant/10 rounded-xl">
        <button
          onClick={() => setTab('upcoming')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'upcoming'
              ? 'bg-white text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setTab('past')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'past'
              ? 'bg-white text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Past
        </button>
      </div>

      {/* Leave List */}
      {loading ? (
        <ListSkeleton count={3} />
      ) : activeLeaves.length === 0 ? (
        <EmptyState title="No leaves found" subtitle="Try adjusting your filters or tab criteria" />
      ) : (
        <div className="space-y-4">
          {activeLeaves.map((l) => (
            <LeaveCard
              key={l._id}
              leave={l}
              onClick={() => setSelected(l)}
              onCancel={onCancel}
            />
          ))}
        </div>
      )}

      {/* Leave Details Modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Leave Details"
        footer={
          selected?.status === 'pending' && (
            <button
              onClick={() => onCancel(selected._id)}
              className="bg-secondary text-on-secondary font-semibold h-11 px-5 rounded-lg hover:bg-secondary/90 flex items-center gap-1.5 transition-colors shadow-sm w-full sm:w-auto justify-center"
            >
              <FiX className="text-base" /> Cancel Leave
            </button>
          )
        }
      >
        {selected && (
          <div className="space-y-4 text-sm font-medium">
            <div className="flex flex-wrap gap-2 pt-1">
              <span className={`chip ${leaveTypeColors[selected.leaveType] || ''}`}>
                {leaveTypeLabel[selected.leaveType]}
              </span>
              <span className={`chip uppercase font-semibold tracking-wider ${statusColors[selected.status] || ''}`}>
                {selected.status}
              </span>
            </div>
            
            <div className="divide-y divide-outline-variant/20 border-t border-b border-outline-variant/20 py-1">
              <Row label="Start Date" value={fmtDate(selected.startDate, 'dd MMM yyyy')} />
              {selected.isHalfDay ? (
                <Row label="Session" value={selected.halfDaySession === 'first_half' ? 'First Half (Morning)' : 'Second Half (Afternoon)'} />
              ) : (
                <Row label="End Date" value={fmtDate(selected.endDate, 'dd MMM yyyy')} />
              )}
              <Row label="Total Days" value={`${selected.totalDays} Day(s)`} />
              <Row label="Applied On" value={fmtDate(selected.createdAt, 'dd MMM yyyy, p')} />
              {selected.actionedAt && (
                <Row label="Actioned On" value={fmtDate(selected.actionedAt, 'dd MMM yyyy, p')} />
              )}
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
                <FiInfo className="text-sm" /> Reason
              </p>
              <p className="mt-1 text-on-surface bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/10 text-body-md font-normal leading-relaxed">
                {selected.reason || 'No description provided.'}
              </p>
            </div>

            {selected.adminComment && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Manager's Comment</p>
                <p className="mt-1 text-on-surface bg-[#fffbeb] dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-200/50 dark:border-amber-900/50 text-body-md font-normal leading-relaxed">
                  {selected.adminComment}
                </p>
              </div>
            )}
            
            {selected.attachment && (
              <a
                href={selected.attachment}
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

const Row = ({ label, value }) => (
  <div className="flex justify-between py-2.5">
    <span className="text-on-surface-variant font-medium">{label}</span>
    <span className="font-semibold text-primary">{value}</span>
  </div>
);

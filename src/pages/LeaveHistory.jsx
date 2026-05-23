import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiSearch, FiX } from 'react-icons/fi';
import { getMyLeaves, cancelLeave } from '../services/leaveService';
import LeaveCard from '../components/LeaveCard';
import { ListSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { fmtDate, leaveTypeLabel, statusColors, leaveTypeColors } from '../utils/format';

const statusOptions = ['all', 'pending', 'approved', 'rejected', 'cancelled'];

export default function LeaveHistory() {
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
      toast.success('Leave cancelled');
      setSelected(null);
      load();
    } catch {}
  };

  const filtered = data.items.filter((l) =>
    l.reason?.toLowerCase().includes(search.toLowerCase()) ||
    leaveTypeLabel[l.leaveType].toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <PageHeader title="Leave History" subtitle="Track all your leave requests" />

      <div className="card p-3">
        <div className="relative mb-3">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search by reason or type"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium capitalize transition ${
                status === s
                  ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-card'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <ListSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No leaves found" subtitle="Try adjusting your filters" />
      ) : (
        <motion.div layout className="space-y-3">
          {filtered.map((l) => (
            <LeaveCard key={l._id} leave={l} onClick={() => setSelected(l)} />
          ))}
        </motion.div>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Leave Details"
        footer={
          selected?.status === 'pending' && (
            <button onClick={() => onCancel(selected._id)} className="btn bg-rose-500 text-white">
              <FiX /> Cancel Leave
            </button>
          )
        }
      >
        {selected && (
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <span className={`chip ${leaveTypeColors[selected.leaveType]}`}>
                {leaveTypeLabel[selected.leaveType]}
              </span>
              <span className={`chip ${statusColors[selected.status]} capitalize`}>{selected.status}</span>
            </div>
            <Row label="Start Date" value={fmtDate(selected.startDate)} />
            {selected.isHalfDay ? (
              <Row label="Session" value={selected.halfDaySession === 'first_half' ? 'First Half' : 'Second Half'} />
            ) : (
              <Row label="End Date" value={fmtDate(selected.endDate)} />
            )}
            <Row label="Total Days" value={selected.totalDays} />
            <Row label="Applied On" value={fmtDate(selected.createdAt)} />
            {selected.actionedAt && <Row label="Actioned On" value={fmtDate(selected.actionedAt)} />}
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wide">Reason</p>
              <p className="mt-1">{selected.reason}</p>
            </div>
            {selected.adminComment && (
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wide">Admin Comment</p>
                <p className="mt-1">{selected.adminComment}</p>
              </div>
            )}
            {selected.attachment && (
              <a href={selected.attachment} target="_blank" rel="noreferrer" className="btn-outline w-full">
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
  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 py-2">
    <span className="text-slate-500">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

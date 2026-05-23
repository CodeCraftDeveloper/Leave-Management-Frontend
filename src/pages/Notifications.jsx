import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiBell, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { ListSkeleton } from '../components/Skeleton';
import { getNotifications, markRead, markAllRead } from '../services/notificationService';
import { fmtDate } from '../utils/format';

const typeStyles = {
  success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20',
  error: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20',
  warning: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20',
  info: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20',
};

export default function Notifications() {
  const [data, setData] = useState({ items: [], unread: 0 });
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getNotifications()
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const onMark = async (id) => {
    await markRead(id);
    load();
  };

  const onMarkAll = async () => {
    await markAllRead();
    toast.success('All notifications marked read');
    load();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        subtitle={`${data.unread} unread`}
        action={
          data.unread > 0 && (
            <button onClick={onMarkAll} className="btn-ghost text-sm">
              <FiCheck /> Mark all
            </button>
          )
        }
      />

      {loading ? (
        <ListSkeleton count={4} />
      ) : data.items.length === 0 ? (
        <EmptyState icon={FiBell} title="No notifications yet" />
      ) : (
        <div className="space-y-3">
          {data.items.map((n) => (
            <motion.div
              key={n._id}
              layout
              onClick={() => !n.read && onMark(n._id)}
              className={`card p-4 flex items-start gap-3 cursor-pointer ${n.read ? 'opacity-70' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full grid place-items-center shrink-0 ${typeStyles[n.type] || typeStyles.info}`}>
                <FiBell />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{n.title}</p>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />}
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1">{fmtDate(n.createdAt, 'dd MMM, p')}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

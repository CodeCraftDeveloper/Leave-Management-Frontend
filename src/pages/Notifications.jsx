import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import EmptyState from '../components/EmptyState';
import { ListSkeleton } from '../components/Skeleton';
import { getNotifications, markRead, markAllRead } from '../services/notificationService';
import { fmtDate } from '../utils/format';

const getIconDetails = (type, read, title) => {
  let iconName = 'notifications';
  let colorClass = read
    ? 'bg-surface-variant text-on-surface-variant'
    : 'bg-surface-container-highest text-primary border border-outline-variant/10';

  const lowerTitle = title?.toLowerCase() || '';

  if (lowerTitle.includes('approve')) {
    iconName = 'check_circle';
    if (!read) colorClass = 'bg-primary text-on-primary';
  } else if (lowerTitle.includes('submit') || lowerTitle.includes('pending') || type === 'pending') {
    iconName = 'pending_actions';
    if (!read) colorClass = 'bg-surface-container-highest text-primary border border-outline-variant/10';
  } else if (lowerTitle.includes('holiday') || lowerTitle.includes('close')) {
    iconName = 'event_busy';
  } else if (lowerTitle.includes('townhall') || lowerTitle.includes('reminder') || type === 'info') {
    iconName = 'campaign';
  }

  return { iconName, colorClass };
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
    try {
      await markRead(id);
      load();
    } catch {}
  };

  const onMarkAll = async () => {
    try {
      await markAllRead();
      toast.success('All alerts marked as read');
      load();
    } catch {}
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      {/* Header Area */}
      <div className="flex items-end justify-between border-b border-outline-variant/30 pb-3">
        <div>
          <h1 className="font-bold text-headline-sm text-primary dark:text-slate-200 tracking-tight">Alerts</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Review your alerts and notifications.</p>
        </div>
        {data.unread > 0 && (
          <button
            onClick={onMarkAll}
            className="text-xs font-bold text-primary hover:text-primary/80 transition-colors bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/20 hover:bg-surface-container-high focus:outline-none"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <ListSkeleton count={4} />
      ) : data.items.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center opacity-60">
          <span className="material-symbols-outlined text-6xl text-outline mb-4">notifications_off</span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">All caught up!</h3>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-[250px]">
            You have no new alerts or notifications to review at this time.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {data.items.map((n) => {
              const { iconName, colorClass } = getIconDetails(n.type, n.read, n.title);
              return (
                <motion.div
                  key={n._id}
                  layout
                  onClick={() => !n.read && onMark(n._id)}
                  className={`group relative flex gap-4 p-4 rounded-xl border transition-all duration-200 hover:shadow-[0px_8px_32px_rgba(27,43,72,0.08)] cursor-pointer overflow-hidden ${
                    n.read
                      ? 'bg-surface-container-lowest border-outline-variant/10 opacity-75'
                      : 'bg-surface-container-low border-outline-variant/20 shadow-[0px_4px_20px_rgba(27,43,72,0.05)]'
                  }`}
                >
                  {/* Left line indicator for unread */}
                  {!n.read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                  )}

                  {/* Icon Circle */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${colorClass}`}>
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {iconName}
                    </span>
                  </div>

                  {/* Message details */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className={`text-sm font-bold truncate ${n.read ? 'text-on-surface' : 'text-primary dark:text-slate-200'}`}>
                        {n.title}
                      </h3>
                      <span className="text-[10px] font-semibold text-on-surface-variant whitespace-nowrap shrink-0">
                        {fmtDate(n.createdAt, 'dd MMM, p')}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant mt-1 leading-relaxed line-clamp-2">
                      {n.message}
                    </p>
                  </div>

                  {/* Dot indicator for unread */}
                  {!n.read ? (
                    <div className="w-2 h-2 rounded-full bg-secondary mt-2 shrink-0 shadow-[0_0_8px_rgba(227,32,39,0.5)]" />
                  ) : (
                    <div className="w-2 h-2 mt-2 shrink-0" />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

import { motion } from 'framer-motion';
import { FiCalendar, FiClock, FiPaperclip } from 'react-icons/fi';
import { fmtDateShort, statusColors, leaveTypeColors, leaveTypeLabel } from '../utils/format';

export default function LeaveCard({ leave, onClick, action }) {
  return (
    <motion.div
      layout
      whileHover={{ scale: 1.005 }}
      className="card p-4 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`chip ${leaveTypeColors[leave.leaveType]}`}>
              {leaveTypeLabel[leave.leaveType]}
            </span>
            <span className={`chip ${statusColors[leave.status]} capitalize`}>{leave.status}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <FiCalendar className="shrink-0" />
            <span className="truncate">
              {leave.isHalfDay
                ? `${fmtDateShort(leave.startDate)} (${leave.halfDaySession === 'first_half' ? 'First Half' : 'Second Half'})`
                : `${fmtDateShort(leave.startDate)} → ${fmtDateShort(leave.endDate)}`
              }
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <FiClock className="shrink-0" />
            {leave.totalDays} day{leave.totalDays > 1 ? 's' : ''}
            {leave.attachment && (
              <>
                <span>•</span>
                <FiPaperclip /> Attachment
              </>
            )}
          </div>
          {leave.reason && (
            <p className="text-sm text-slate-500 mt-2 line-clamp-2">{leave.reason}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </motion.div>
  );
}

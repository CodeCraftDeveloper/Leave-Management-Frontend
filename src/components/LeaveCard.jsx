import { motion } from 'framer-motion';
import { fmtDateShort, leaveTypeLabel } from '../utils/format';

const statusColors = {
  approved: 'bg-[#dcfce7] text-[#166534]',
  pending: 'bg-surface-container-high text-[#92400e] border border-outline-variant/30',
  rejected: 'bg-rose-100 text-rose-800',
  cancelled: 'bg-slate-100 text-slate-600',
};

const getIconName = (type) => {
  switch (type) {
    case 'sick':
      return 'medical_services';
    case 'emergency':
      return 'emergency';
    case 'casual':
    case 'personal':
      return 'flight_takeoff';
    default:
      return 'calendar_month';
  }
};

export default function LeaveCard({ leave, onClick, onCancel }) {
  const iconName = getIconName(leave.leaveType);
  const isPending = leave.status === 'pending';

  return (
    <motion.article
      layout
      whileHover={{ y: -2 }}
      className="bg-surface-container-lowest dark:bg-slate-900 rounded-xl p-md shadow-[0px_4px_20px_rgba(27,43,72,0.05)] border border-surface-container-high hover:border-primary/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-md cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-md flex-1 min-w-0">
        {/* Type Icon Box */}
        <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-primary border border-outline-variant/10">
          <span className="material-symbols-outlined text-2xl">{iconName}</span>
        </div>
        
        {/* Content Details */}
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-primary dark:text-slate-200">
              {leaveTypeLabel[leave.leaveType] || 'Leave'}
            </h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${statusColors[leave.status] || ''}`}>
              {leave.status}
            </span>
          </div>
          
          <p className="text-body-md text-on-surface-variant font-medium">
            {leave.isHalfDay
              ? `${fmtDateShort(leave.startDate)} (Half Day)`
              : `${fmtDateShort(leave.startDate)} - ${fmtDateShort(leave.endDate)}`
            }
          </p>
          
          <div className="flex items-center gap-1 text-xs text-on-surface-variant font-medium flex-wrap">
            <span>{leave.totalDays} {leave.totalDays === 1 ? 'Day' : 'Days'}</span>
            {leave.attachment && (
              <span className="flex items-center gap-0.5 ml-2 text-primary font-semibold">
                <span className="material-symbols-outlined text-sm">attach_file</span> Attachment
              </span>
            )}
            {leave.actionedBy && (
              <span className="ml-2">• Actioned by Manager</span>
            )}
          </div>
          {leave.reason && (
            <div className="text-xs text-on-surface-variant mt-2 pt-2 border-t border-outline-variant/10">
              <span className="font-semibold text-primary block mb-0.5">Reason</span>
              <p className="text-slate-600 dark:text-slate-300 italic">"{leave.reason}"</p>
            </div>
          )}
          {leave.remarks && (
            <div className="text-xs text-on-surface-variant mt-2 pt-2 border-t border-outline-variant/10">
              <span className="font-semibold text-primary block mb-0.5">Manager Remarks</span>
              <p className="text-slate-600 dark:text-slate-300 italic">"{leave.remarks}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {isPending && onCancel && (
        <div className="flex gap-2 sm:flex-col justify-end shrink-0 pt-3 sm:pt-0 border-t border-outline-variant/10 sm:border-none">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCancel(leave._id);
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-lg text-secondary font-semibold text-xs hover:bg-error-container/50 transition-colors"
          >
            Cancel Request
          </button>
        </div>
      )}
    </motion.article>
  );
}

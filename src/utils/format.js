import { format, parseISO } from 'date-fns';

export const fmtDate = (d, p = 'dd MMM yyyy') => {
  if (!d) return '-';
  const date = typeof d === 'string' ? parseISO(d) : d;
  return format(date, p);
};

export const fmtDateShort = (d) => fmtDate(d, 'dd MMM');

const startOfLocalDay = (value = new Date()) => {
  const date = value instanceof Date ? new Date(value) : parseISO(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const isPastLeave = (leave) => {
  if (!leave?.endDate) return false;
  return startOfLocalDay(leave.endDate) < startOfLocalDay();
};

export const leaveTypeLabel = {
  leave: 'Leave',
  casual: 'Casual',
  sick: 'Sick',
  emergency: 'Emergency',
  paid: 'Paid',
  unpaid: 'Unpaid',
};

export const statusColors = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300',
};

export const leaveTypeColors = {
  leave: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  casual: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  sick: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  emergency: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  unpaid: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',
};

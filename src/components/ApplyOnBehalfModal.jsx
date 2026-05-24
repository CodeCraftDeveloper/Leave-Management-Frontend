import { useForm } from 'react-hook-form';
import { useMemo, useState, useEffect } from 'react';
import { FiCalendar, FiFileText, FiSend, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getHolidays } from '../services/leaveService';
import { applyLeaveOnBehalf } from '../services/adminService';
import { calculateDays } from '../utils/days';
import Modal from './Modal';

const types = [
  { value: 'casual', label: 'Casual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'emergency', label: 'Emergency Leave' },
  { value: 'paid', label: 'Paid Leave' },
  { value: 'unpaid', label: 'Unpaid Leave' },
];

export default function ApplyOnBehalfModal({ open, onClose, employee, onSuccess }) {
  const today = new Date().toISOString().slice(0, 10);
  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { leaveType: 'casual', startDate: today, endDate: today, reason: '', isHalfDay: false, halfDaySession: 'first_half' },
  });
  
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    if (open) {
      getHolidays().then(setHolidays).catch(() => {});
      reset({
        leaveType: 'casual',
        startDate: today,
        endDate: today,
        reason: '',
        isHalfDay: false,
        halfDaySession: 'first_half',
      });
    }
  }, [open, reset, today]);

  const leaveType = watch('leaveType');
  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const isHalfDay = watch('isHalfDay');

  // Sync end date with start date if half day
  useEffect(() => {
    if (isHalfDay && startDate) {
      setValue('endDate', startDate);
    }
  }, [isHalfDay, startDate, setValue]);

  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    if (isHalfDay) {
      const count = calculateDays(startDate, startDate, holidays);
      return count > 0 ? 0.5 : 0;
    }
    const count = calculateDays(startDate, endDate, holidays);
    return count > 0 ? count : 0;
  }, [startDate, endDate, isHalfDay, holidays]);

  const balance = useMemo(() => {
    return employee?.leaveBalance?.[leaveType] ?? 0;
  }, [employee, leaveType]);

  const isOverBalance = totalDays > balance;

  const onSubmit = async (data) => {
    if (!data.isHalfDay && new Date(data.endDate) < new Date(data.startDate)) {
      toast.error('End date cannot be before start date');
      return;
    }
    if (totalDays === 0) {
      toast.error('The selected duration contains no countable leave days');
      return;
    }
    if (isOverBalance) {
      toast.error('Insufficient leave balance');
      return;
    }

    try {
      await applyLeaveOnBehalf({
        employeeId: employee._id,
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.isHalfDay ? data.startDate : data.endDate,
        reason: data.reason,
        isHalfDay: data.isHalfDay,
        halfDaySession: data.isHalfDay ? data.halfDaySession : '',
      });
      toast.success('Leave applied successfully');
      onSuccess?.();
      onClose();
    } catch (err) {
      // Errors handled by api.js toast
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Apply Leave on Behalf: ${employee?.name || ''}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Leave Type</label>
            <select className="input text-sm py-2 px-3" {...register('leaveType', { required: true })}>
              {types.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col justify-end">
            <div className="rounded-xl border border-outline-variant/30 px-3 py-2 flex items-center justify-between bg-surface-container-low">
              <span className="text-xs text-on-surface-variant">Balance:</span>
              <span className="text-sm font-bold text-primary">{balance} days</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30">
          <input
            id="isHalfDayBehalf"
            type="checkbox"
            className="w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant"
            {...register('isHalfDay')}
          />
          <label htmlFor="isHalfDayBehalf" className="text-xs font-medium text-on-surface-variant cursor-pointer select-none">
            This is a half-day leave
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label text-xs">{isHalfDay ? 'Date' : 'Start Date'}</label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none w-3.5 h-3.5" />
              <input type="date" onClick={(e) => e.target.showPicker?.()} className="input text-sm pl-8 py-2 px-3" {...register('startDate', { required: true })} />
            </div>
          </div>
          {!isHalfDay ? (
            <div>
              <label className="label text-xs">End Date</label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none w-3.5 h-3.5" />
                <input type="date" onClick={(e) => e.target.showPicker?.()} className="input text-sm pl-8 py-2 px-3" {...register('endDate', { required: true })} />
              </div>
            </div>
          ) : (
            <div>
              <label className="label text-xs">Session</label>
              <select className="input text-sm py-2 px-3" {...register('halfDaySession')}>
                <option value="first_half">First Half (Morning)</option>
                <option value="second_half">Second Half (Afternoon)</option>
              </select>
            </div>
          )}
        </div>

        {totalDays > 0 && isOverBalance && (
          <div className="flex items-start gap-2.5 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50">
            <FiAlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500 mt-0.5" />
            <div>
              <p className="font-semibold">Insufficient Balance</p>
              <p className="text-rose-500/90 dark:text-rose-400/90 mt-0.5">
                Requesting <b>{totalDays} days</b>, but employee has <b>{balance} days</b> remaining.
              </p>
            </div>
          </div>
        )}

        <div className="rounded-xl bg-surface-container-low border border-outline-variant/30 px-3 py-2.5 flex items-center justify-between">
          <span className="text-xs font-medium text-on-surface-variant">Total Duration</span>
          <span className="text-base font-bold text-primary">
            {totalDays} {totalDays === 1 ? 'day' : 'days'}
          </span>
        </div>

        <div>
          <label className="label text-xs">Reason</label>
          <div className="relative">
            <FiFileText className="absolute left-3 top-3 text-on-surface-variant/50 w-3.5 h-3.5" />
            <textarea
              rows={3}
              placeholder="Reason for logging leave..."
              className="input text-sm pl-8 pt-2.5 px-3 min-h-[70px]"
              {...register('reason', { required: 'Reason is required' })}
            />
          </div>
          {errors.reason && <p className="text-[10px] text-rose-500 mt-1">{errors.reason.message}</p>}
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn btn-ghost text-xs py-2 px-3.5">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || totalDays === 0 || isOverBalance}
            className="btn btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
          >
            <FiSend className="w-3 h-3" /> {isSubmitting ? 'Submitting...' : 'Apply & Approve'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

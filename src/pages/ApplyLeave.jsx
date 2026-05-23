import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiFileText, FiUpload, FiSend, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { applyLeave, getHolidays, getMySummary } from '../services/leaveService';
import { calculateDays } from '../utils/days';
import PageHeader from '../components/PageHeader';

const types = [
  { value: 'casual', label: 'Casual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'emergency', label: 'Emergency Leave' },
  { value: 'paid', label: 'Paid Leave' },
  { value: 'unpaid', label: 'Unpaid Leave' },
];

export default function ApplyLeave() {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { leaveType: 'casual', startDate: today, endDate: today, reason: '', isHalfDay: false, halfDaySession: 'first_half' },
  });
  const [file, setFile] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    getHolidays().then(setHolidays).catch(() => {});
    getMySummary().then(setSummary).catch(() => {});
  }, []);

  const leaveType = watch('leaveType');
  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const isHalfDay = watch('isHalfDay');

  // If isHalfDay is checked, ensure endDate matches startDate
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
    return summary?.leaveBalance?.[leaveType] ?? 0;
  }, [summary, leaveType]);

  const isOverBalance = totalDays > balance;

  const onSubmit = async (data) => {
    if (!data.isHalfDay && new Date(data.endDate) < new Date(data.startDate)) {
      toast.error('End date cannot be before start date');
      return;
    }
    if (totalDays === 0) {
      toast.error('The selected duration contains no working days');
      return;
    }
    if (isOverBalance) {
      toast.error('Insufficient leave balance');
      return;
    }

    const fd = new FormData();
    fd.append('leaveType', data.leaveType);
    fd.append('startDate', data.startDate);
    fd.append('endDate', data.isHalfDay ? data.startDate : data.endDate);
    fd.append('reason', data.reason);
    fd.append('isHalfDay', data.isHalfDay);
    if (data.isHalfDay) {
      fd.append('halfDaySession', data.halfDaySession);
    }
    if (file) fd.append('attachment', file);

    try {
      await applyLeave(fd);
      toast.success('Leave applied successfully');
      navigate('/history');
    } catch {}
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <PageHeader title="Apply for Leave" subtitle="Fill the form below to submit a request" />

      <motion.form
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onSubmit={handleSubmit(onSubmit)}
        className="card p-5 sm:p-6 space-y-5"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Leave Type</label>
            <select className="input" {...register('leaveType', { required: true })}>
              {types.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col justify-end">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <span className="text-sm text-slate-500">Available Balance:</span>
              <span className="text-base font-bold text-slate-700 dark:text-slate-200">{balance} days</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/30 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
          <input
            id="isHalfDay"
            type="checkbox"
            className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300 dark:border-slate-700"
            {...register('isHalfDay')}
          />
          <label htmlFor="isHalfDay" className="text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer select-none">
            This is a half-day leave
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{isHalfDay ? 'Date' : 'Start Date'}</label>
            <div className="relative">
              <FiCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input type="date" className="input pl-10" {...register('startDate', { required: true })} />
            </div>
          </div>
          {!isHalfDay ? (
            <div>
              <label className="label">End Date</label>
              <div className="relative">
                <FiCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input type="date" className="input pl-10" {...register('endDate', { required: true })} />
              </div>
            </div>
          ) : (
            <div>
              <label className="label">Session</label>
              <select className="input" {...register('halfDaySession')}>
                <option value="first_half">First Half (Morning)</option>
                <option value="second_half">Second Half (Afternoon)</option>
              </select>
            </div>
          )}
        </div>

        {totalDays > 0 && isOverBalance && (
          <div className="flex items-start gap-3 text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50">
            <FiAlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
            <div>
              <p className="font-semibold">Insufficient Balance</p>
              <p className="text-rose-500/90 dark:text-rose-400/90 mt-0.5">
                You are requesting <b>{totalDays} day(s)</b>, but you only have <b>{balance} day(s)</b> left in your balance.
              </p>
            </div>
          </div>
        )}

        <div className="rounded-xl bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-500/10 dark:to-accent-500/10 px-4 py-3.5 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Requested Duration</span>
          <span className="text-xl font-bold text-primary-700 dark:text-primary-300">
            {totalDays} {totalDays === 1 ? 'day' : 'days'}
          </span>
        </div>

        <div>
          <label className="label">Reason</label>
          <div className="relative">
            <FiFileText className="absolute left-3.5 top-3 text-slate-400" />
            <textarea
              rows={4}
              placeholder="Briefly describe the reason for your leave..."
              className="input pl-10 pt-3"
              {...register('reason', { required: 'Reason is required', maxLength: 1000 })}
            />
          </div>
          {errors.reason && <p className="text-xs text-rose-500 mt-1">{errors.reason.message}</p>}
        </div>

        <div>
          <label className="label">Attachment (optional)</label>
          <label className="flex items-center gap-3 input cursor-pointer">
            <FiUpload className="text-slate-400" />
            <span className="text-sm text-slate-500 truncate">
              {file ? file.name : 'Upload supporting document (jpg, pdf, doc)'}
            </span>
            <input
              type="file"
              hidden
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || totalDays === 0 || isOverBalance}
          className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
        >
          <FiSend /> {isSubmitting ? 'Submitting…' : 'Submit Application'}
        </button>
      </motion.form>
    </div>
  );
}

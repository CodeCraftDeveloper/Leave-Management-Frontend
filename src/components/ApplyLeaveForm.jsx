import { useForm } from 'react-hook-form';
import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { applyLeave, getHolidays } from '../services/leaveService';
import { calculateDays } from '../utils/days';
import { useAuth } from '../context/AuthContext';

const types = [
  { value: 'leave', label: 'Leave' },
];

export default function ApplyLeaveForm({ defaultDate, onSubmitted }) {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const initialDate = defaultDate || today;
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      leaveType: 'leave',
      startDate: initialDate,
      endDate: initialDate,
      reason: '',
      isHalfDay: false,
      halfDaySession: 'first_half',
    },
  });
  const [file, setFile] = useState(null);
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    getHolidays().then(setHolidays).catch(() => {});
  }, []);

  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const isHalfDay = watch('isHalfDay');

  useEffect(() => {
    if (isHalfDay && startDate) {
      setValue('endDate', startDate);
    }
  }, [isHalfDay, startDate, setValue]);

  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    if (isHalfDay) {
      const count = calculateDays(startDate, startDate, holidays, { employee: user });
      return count > 0 ? 0.5 : 0;
    }
    const count = calculateDays(startDate, endDate, holidays, { employee: user });
    return count > 0 ? count : 0;
  }, [startDate, endDate, isHalfDay, holidays, user]);

  const onSubmit = async (data) => {
    if (!data.isHalfDay && new Date(data.endDate) < new Date(data.startDate)) {
      toast.error('End date cannot be before start date');
      return;
    }
    if (totalDays === 0) {
      toast.error('The selected duration contains no countable leave days');
      return;
    }

    const fd = new FormData();
    fd.append('leaveType', data.leaveType);
    fd.append('startDate', data.startDate);
    fd.append('endDate', data.isHalfDay ? data.startDate : data.endDate);
    fd.append('reason', data.reason);
    fd.append('isHalfDay', data.isHalfDay);
    if (data.isHalfDay) fd.append('halfDaySession', data.halfDaySession);
    if (file) fd.append('attachment', file);

    try {
      const created = await applyLeave(fd);
      toast.success('Leave applied successfully');
      onSubmitted?.(created);
    } catch {}
  };

  return (
    <motion.form
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
    >
      {/* Leave Type */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-primary dark:text-slate-300">Leave Type</label>
        <div className="relative">
          <select
            className="w-full h-[48px] appearance-none bg-surface-container-lowest border border-outline-variant rounded-xl px-4 text-base text-on-surface focus:outline-none focus:border-2 focus:border-primary focus:ring-0 transition"
            {...register('leaveType', { required: true })}
          >
            {types.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
        </div>
      </div>

      {/* Half Day Checkbox */}
      <div className="flex items-center gap-3 bg-surface-container-low dark:bg-slate-900/30 p-3.5 rounded-xl border border-outline-variant/20">
        <input
          id="isHalfDay"
          type="checkbox"
          className="w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant"
          {...register('isHalfDay')}
        />
        <label htmlFor="isHalfDay" className="text-sm font-medium text-on-surface-variant cursor-pointer select-none leading-none">
          This is a half-day leave
        </label>
      </div>

      {/* Dates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-primary">
            {isHalfDay ? 'Date' : 'Start Date'}
          </label>
          <input
            type="date"
            onClick={(e) => e.target.showPicker?.()}
            className="w-full h-[48px] bg-surface-container-lowest border border-outline-variant rounded-xl px-4 text-base text-on-surface focus:outline-none focus:border-2 focus:border-primary focus:ring-0 transition"
            {...register('startDate', { required: true })}
          />
        </div>
        {!isHalfDay ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-primary">End Date</label>
            <input
              type="date"
              onClick={(e) => e.target.showPicker?.()}
              className="w-full h-[48px] bg-surface-container-lowest border border-outline-variant rounded-xl px-4 text-base text-on-surface focus:outline-none focus:border-2 focus:border-primary focus:ring-0 transition"
              {...register('endDate', { required: true })}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-primary dark:text-slate-300">Session</label>
            <div className="relative">
              <select
                className="w-full h-[48px] appearance-none bg-surface-container-lowest border border-outline-variant rounded-xl px-4 text-base text-on-surface focus:outline-none focus:border-2 focus:border-primary focus:ring-0 transition"
                {...register('halfDaySession')}
              >
                <option value="first_half">First Half (Morning)</option>
                <option value="second_half">Second Half (Afternoon)</option>
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
            </div>
          </div>
        )}
      </div>

      {/* Duration Display */}
      <div className="bg-surface-container-low rounded-xl p-4 flex items-center justify-between border border-surface-container-high">
        <span className="text-sm font-semibold text-on-surface-variant">Total Requested Duration</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xl font-bold text-primary dark:text-slate-200">{totalDays || '--'}</span>
          <span className="text-sm font-semibold text-on-surface-variant">Days</span>
        </div>
      </div>

      {/* Reason with Inline Attachment Trigger */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-primary dark:text-slate-300">Reason</label>
        <div className="relative bg-surface-container-lowest border border-outline-variant rounded-xl focus-within:border-2 focus-within:border-primary transition-all">
          <textarea
            rows={4}
            placeholder="Briefly describe the reason for your leave..."
            className="w-full bg-transparent px-4 pt-3 pb-12 text-base text-on-surface outline-none border-none focus:ring-0 resize-none"
            {...register('reason', { required: 'Reason is required', maxLength: 1000 })}
          />
          {/* File Input Wrapper inside Textarea */}
          <label className="absolute bottom-2 right-2 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-2 rounded-full hover:bg-surface-container-low cursor-pointer">
            <span className="material-symbols-outlined text-xl">attach_file</span>
            <input
              type="file"
              hidden
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>
        {errors.reason && <p className="text-xs text-rose-500 mt-1">{errors.reason.message}</p>}
      </div>

      {/* Attached File Indicator */}
      {file && (
        <div className="flex items-center justify-between text-xs text-on-surface-variant bg-surface-container-low px-4 py-2.5 rounded-xl border border-outline-variant/30">
          <div className="flex items-center gap-2">
            <span className="truncate max-w-[240px] font-semibold text-primary dark:text-slate-200">{file.name}</span>
            <span className="text-[10px] text-on-surface-variant">({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
          <button
            type="button"
            onClick={() => setFile(null)}
            className="text-secondary hover:text-secondary-container transition-colors p-1"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || totalDays === 0}
        className="w-full h-12 bg-primary text-on-primary rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>{isSubmitting ? 'Submitting...' : 'Submit Application'}</span>
        <span className="material-symbols-outlined text-[18px]">send</span>
      </button>
    </motion.form>
  );
}

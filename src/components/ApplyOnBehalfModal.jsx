import { useForm } from 'react-hook-form';
import { useMemo, useState, useEffect } from 'react';
import { FiCalendar, FiFileText, FiSend, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getHolidays } from '../services/leaveService';
import { applyLeaveOnBehalf } from '../services/adminService';
import { calculateDays } from '../utils/days';
import { useAuth } from '../context/AuthContext';
import { isSuperAdmin } from '../utils/roles';
import Modal from './Modal';

const types = [
  { value: 'leave', label: 'Leave' },
];

export default function ApplyOnBehalfModal({ open, onClose, employee, onSuccess }) {
  const { user } = useAuth();
  const superAdmin = isSuperAdmin(user);
  const today = new Date().toISOString().slice(0, 10);
  // Only the super admin may backfill leaves for dates that have already
  // passed; scoped heads are restricted to today onward.
  const minDate = superAdmin ? undefined : today;
  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { leaveType: 'leave', startDate: today, endDate: today, reason: '', isHalfDay: false, halfDaySession: 'first_half' },
  });
  
  const [holidays, setHolidays] = useState([]);
  const [staffingAlert, setStaffingAlert] = useState(null);
  const [staffingOverrideReason, setStaffingOverrideReason] = useState('');
  // Holds the validated form data while the confirmation step is shown.
  const [confirmData, setConfirmData] = useState(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (open) {
      getHolidays().then(setHolidays).catch(() => {});
      reset({
        leaveType: 'leave',
        startDate: today,
        endDate: today,
        reason: '',
        isHalfDay: false,
        halfDaySession: 'first_half',
      });
      setStaffingAlert(null);
      setStaffingOverrideReason('');
      setConfirmData(null);
      setApplying(false);
    }
  }, [open, reset, today]);

  const leaveType = watch('leaveType');
  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const isHalfDay = watch('isHalfDay');
  const halfDaySession = watch('halfDaySession');

  // Sync end date with start date if half day
  useEffect(() => {
    if (isHalfDay && startDate) {
      setValue('endDate', startDate);
    }
  }, [isHalfDay, startDate, setValue]);

  useEffect(() => {
    setStaffingAlert(null);
    setStaffingOverrideReason('');
  }, [leaveType, startDate, endDate, isHalfDay, halfDaySession]);

  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    if (isHalfDay) {
      const count = calculateDays(startDate, startDate, holidays, { employee });
      return count > 0 ? 0.5 : 0;
    }
    const count = calculateDays(startDate, endDate, holidays, { employee });
    return count > 0 ? count : 0;
  }, [startDate, endDate, isHalfDay, holidays, employee]);

  // Step 1: validate the form, then open the confirmation popup. The Reason
  // field is enforced as required by react-hook-form before this runs.
  const onSubmit = (data) => {
    if (!data.isHalfDay && new Date(data.endDate) < new Date(data.startDate)) {
      toast.error('End date cannot be before start date');
      return;
    }
    if (totalDays === 0) {
      toast.error('The selected duration contains no countable leave days');
      return;
    }
    if (!data.reason || !data.reason.trim()) {
      toast.error('Please fill in the reason');
      return;
    }
    if (staffingAlert && !staffingOverrideReason.trim()) {
      toast.error('Enter an override reason before approving this leave');
      return;
    }
    setConfirmData(data);
  };

  // Step 2: user confirmed — actually create the leave.
  const confirmApply = async () => {
    if (!confirmData) return;
    setApplying(true);
    try {
      await applyLeaveOnBehalf({
        employeeId: employee._id,
        leaveType: confirmData.leaveType,
        startDate: confirmData.startDate,
        endDate: confirmData.isHalfDay ? confirmData.startDate : confirmData.endDate,
        reason: confirmData.reason,
        isHalfDay: confirmData.isHalfDay,
        halfDaySession: confirmData.isHalfDay ? confirmData.halfDaySession : '',
        overrideStaffingLimit: !!staffingAlert,
        staffingOverrideReason: staffingAlert ? staffingOverrideReason.trim() : '',
      });
      toast.success('Leave applied successfully');
      setConfirmData(null);
      onSuccess?.();
      onClose();
    } catch (error) {
      if (error.response?.data?.code === 'STAFFING_COVERAGE_LIMIT') {
        // Return to the form so an override reason can be entered.
        setStaffingAlert(error.response.data.staffingCoverage);
        setConfirmData(null);
        toast.error('Department coverage limit reached — add an override reason.');
      }
    } finally {
      setApplying(false);
    }
  };

  const fmtDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return d;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <Modal open={open} onClose={onClose} title={`Apply Leave on Behalf: ${employee?.name || ''}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Leave Type</label>
          <select className="input text-sm py-2 px-3" {...register('leaveType', { required: true })}>
            {types.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
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
              <input type="date" min={minDate} onClick={(e) => e.target.showPicker?.()} className="input text-sm pl-8 py-2 px-3" {...register('startDate', { required: true })} />
            </div>
            {superAdmin && (
              <p className="text-[10px] text-on-surface-variant mt-1">
                You can select a past date to backfill a leave that already happened.
              </p>
            )}
          </div>
          {!isHalfDay ? (
            <div>
              <label className="label text-xs">End Date</label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none w-3.5 h-3.5" />
                <input type="date" min={minDate} onClick={(e) => e.target.showPicker?.()} className="input text-sm pl-8 py-2 px-3" {...register('endDate', { required: true })} />
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

        {staffingAlert && (
          <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100">
            <div className="flex items-start gap-2.5 text-xs">
              <FiAlertCircle className="mt-0.5 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold">Department coverage limit reached</p>
                <p className="mt-0.5">
                  {staffingAlert.department} must keep {staffingAlert.minimumOnDuty} employee(s) on duty.
                </p>
                {staffingAlert.violations.slice(0, 3).map((violation) => (
                  <p key={`${violation.date}-${violation.session}`} className="mt-1">
                    {violation.date} ({violation.sessionLabel}): {violation.availableStaff} available
                  </p>
                ))}
              </div>
            </div>
            <div>
              <label className="label text-xs">Override reason (required)</label>
              <textarea
                rows={2}
                value={staffingOverrideReason}
                onChange={(event) => setStaffingOverrideReason(event.target.value)}
                className="input text-sm"
                placeholder="Explain why coverage can be overridden..."
              />
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
            disabled={isSubmitting || totalDays === 0 || (!!staffingAlert && !staffingOverrideReason.trim())}
            className="btn btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
          >
            <FiSend className="w-3 h-3" /> {staffingAlert ? 'Review & Approve' : 'Review & Apply'}
          </button>
        </div>
      </form>

      <Modal
        open={!!confirmData}
        onClose={() => !applying && setConfirmData(null)}
        title="Confirm Leave"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-on-surface-variant">
            <FiAlertCircle className="mt-0.5 w-4 shrink-0 text-primary" />
            <p>
              This leave will be <span className="font-semibold text-on-surface">recorded and auto-approved</span> on
              behalf of <span className="font-semibold text-on-surface">{employee?.name}</span>. Please review the
              details below.
            </p>
          </div>

          <dl className="rounded-xl border border-outline-variant/30 divide-y divide-outline-variant/20 text-sm">
            <div className="flex justify-between gap-3 px-3 py-2.5">
              <dt className="text-on-surface-variant">Employee</dt>
              <dd className="font-medium text-right">{employee?.name} {employee?.employeeId ? `(${employee.employeeId})` : ''}</dd>
            </div>
            <div className="flex justify-between gap-3 px-3 py-2.5">
              <dt className="text-on-surface-variant">Leave Type</dt>
              <dd className="font-medium text-right capitalize">{confirmData?.leaveType}</dd>
            </div>
            <div className="flex justify-between gap-3 px-3 py-2.5">
              <dt className="text-on-surface-variant">{confirmData?.isHalfDay ? 'Date' : 'Dates'}</dt>
              <dd className="font-medium text-right">
                {confirmData?.isHalfDay
                  ? `${fmtDate(confirmData?.startDate)} (${confirmData?.halfDaySession === 'second_half' ? 'Second Half' : 'First Half'})`
                  : `${fmtDate(confirmData?.startDate)} → ${fmtDate(confirmData?.endDate)}`}
              </dd>
            </div>
            <div className="flex justify-between gap-3 px-3 py-2.5">
              <dt className="text-on-surface-variant">Total Duration</dt>
              <dd className="font-bold text-primary text-right">{totalDays} {totalDays === 1 ? 'day' : 'days'}</dd>
            </div>
            <div className="px-3 py-2.5">
              <dt className="text-on-surface-variant mb-1">Reason</dt>
              <dd className="font-medium whitespace-pre-wrap break-words">{confirmData?.reason}</dd>
            </div>
            {staffingAlert && staffingOverrideReason.trim() && (
              <div className="px-3 py-2.5">
                <dt className="text-amber-600 mb-1">Coverage Override Reason</dt>
                <dd className="font-medium whitespace-pre-wrap break-words">{staffingOverrideReason.trim()}</dd>
              </div>
            )}
          </dl>

          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={() => setConfirmData(null)}
              disabled={applying}
              className="btn btn-ghost text-xs py-2 px-3.5"
            >
              Back
            </button>
            <button
              type="button"
              onClick={confirmApply}
              disabled={applying}
              className="btn btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
            >
              <FiSend className="w-3 h-3" /> {applying ? 'Applying...' : 'Confirm & Apply'}
            </button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
}

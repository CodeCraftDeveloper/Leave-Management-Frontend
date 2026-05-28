import { useEffect, useState } from 'react';
import { FiSearch, FiCheck, FiX, FiAlertCircle, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { ListSkeleton } from '../../components/Skeleton';
import Modal from '../../components/Modal';
import { getAllLeaves, updateLeaveStatus, exportLeavesExcel } from '../../services/adminService';
import { fmtDate, leaveTypeLabel, statusColors, leaveTypeColors } from '../../utils/format';

const statusOptions = ['all', 'pending', 'approved', 'rejected'];
const typeOptions = ['all', 'leave'];

export default function AdminLeaveRequests() {
  const [filters, setFilters] = useState({ status: 'pending', type: 'all', search: '' });
  const [data, setData] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(null);
  const [comment, setComment] = useState('');
  const [staffingAlert, setStaffingAlert] = useState(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportLeavesExcel({
        status: filters.status === 'all' ? undefined : filters.status,
        type: filters.type === 'all' ? undefined : filters.type,
        search: filters.search || undefined,
      });
      toast.success('Leaves exported');
    } catch {
      // api interceptor already surfaces the error
    } finally {
      setExporting(false);
    }
  };

  const load = () => {
    setLoading(true);
    getAllLeaves({
      status: filters.status === 'all' ? undefined : filters.status,
      type: filters.type === 'all' ? undefined : filters.type,
      search: filters.search || undefined,
      limit: 50,
    })
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(load, [filters.status, filters.type]);

  const submitAction = async () => {
    const isStaffingOverride = action === 'approved' && !!staffingAlert;
    if (isStaffingOverride && !comment.trim()) {
      toast.error('Enter an override reason before approving this leave');
      return;
    }

    try {
      await updateLeaveStatus(selected._id, {
        status: action,
        adminComment: comment,
        overrideStaffingLimit: isStaffingOverride,
        staffingOverrideReason: isStaffingOverride ? comment.trim() : '',
      });
      toast.success(`Leave ${action}`);
      setSelected(null);
      setAction(null);
      setComment('');
      setStaffingAlert(null);
      load();
    } catch (error) {
      if (error.response?.data?.code === 'STAFFING_COVERAGE_LIMIT') {
        setStaffingAlert(error.response.data.staffingCoverage);
      }
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Leave Requests" subtitle="Approve or reject employee leave applications" />
        <button
          onClick={handleExport}
          disabled={exporting}
          className="btn-outline gap-2 text-sm disabled:opacity-60"
        >
          <FiDownload />
          {exporting ? 'Exporting…' : 'Export Excel'}
        </button>
      </div>

      <div className="card p-4 space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="relative"
        >
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
          <input
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search employee by name, ID or department"
            className="input pl-10 text-sm sm:text-base"
          />
        </form>
        <div className="grid grid-cols-2 gap-3">
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="input text-sm sm:text-base">
            {statusOptions.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
          <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className="input text-sm sm:text-base">
            {typeOptions.map((t) => (
              <option key={t} value={t} className="capitalize">
                {t === 'all' ? 'All types' : leaveTypeLabel[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <ListSkeleton count={5} />
      ) : data.items.length === 0 ? (
        <EmptyState title="No requests found" subtitle="Try adjusting your filters" />
      ) : (
        <div className="space-y-3">
          {data.items.map((l) => (
            <div key={l._id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container border border-outline-variant/50 grid place-items-center font-semibold shrink-0">
                  {l.employee?.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 items-center">
                    <p className="text-sm sm:text-base font-semibold truncate">{l.employee?.name}</p>
                    <span className="text-xs text-on-surface-variant/60">· {l.employee?.employeeId}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant truncate">{l.employee?.department}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className={`chip text-[11px] sm:text-xs ${statusColors[l.status]} capitalize`}>{l.status}</span>
                    <span className={`chip text-[11px] sm:text-xs ${leaveTypeColors[l.leaveType]}`}>{leaveTypeLabel[l.leaveType]}</span>
                    <span className="chip text-[11px] sm:text-xs bg-surface-container-low text-primary border border-outline-variant/30">{l.totalDays} day{l.totalDays > 1 ? 's' : ''}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant/75 mt-2">
                    {fmtDate(l.startDate)} → {fmtDate(l.endDate)}
                  </p>
                  <p className="text-sm mt-2 line-clamp-2">{l.reason}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setSelected(l)} className="btn-outline flex-1 gap-1 px-2 text-xs sm:gap-2 sm:px-4 sm:text-sm">Details</button>
                {l.status === 'pending' && (
                  <>
                    <button onClick={() => { setSelected(l); setAction('approved'); setComment(''); setStaffingAlert(null); }} className="btn bg-emerald-500 text-white flex-1 gap-1 px-2 text-xs sm:gap-2 sm:px-4 sm:text-sm">
                      <FiCheck /> Approve
                    </button>
                    <button onClick={() => { setSelected(l); setAction('rejected'); setComment(''); setStaffingAlert(null); }} className="btn bg-rose-500 text-white flex-1 gap-1 px-2 text-xs sm:gap-2 sm:px-4 sm:text-sm">
                      <FiX /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!selected && !action}
        onClose={() => setSelected(null)}
        title="Leave Details"
      >
        {selected && (
          <div className="space-y-3 text-sm">
            <Row label="Employee" value={`${selected.employee?.name} (${selected.employee?.employeeId})`} />
            <Row label="Department" value={selected.employee?.department} />
            <Row label="Email" value={selected.employee?.email} />
            <Row label="Type" value={leaveTypeLabel[selected.leaveType]} />
            <Row label="Status" value={selected.status} />
            <Row label="Start" value={fmtDate(selected.startDate)} />
            <Row label="End" value={fmtDate(selected.endDate)} />
            <Row label="Total Days" value={selected.totalDays} />
            <div>
              <p className="text-on-surface-variant text-xs uppercase">Reason</p>
              <p>{selected.reason}</p>
            </div>
            {selected.adminComment && (
              <div>
                <p className="text-on-surface-variant text-xs uppercase">Admin Comment</p>
                <p>{selected.adminComment}</p>
              </div>
            )}
            {selected.staffingOverride && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                <p className="text-xs font-semibold uppercase">Staffing Override Applied</p>
                <p className="mt-1">{selected.staffingOverrideReason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={!!action}
        onClose={() => { setAction(null); setComment(''); setStaffingAlert(null); }}
        title={action === 'approved' ? 'Approve Leave' : 'Reject Leave'}
        footer={
          <>
            <button onClick={() => { setAction(null); setComment(''); setStaffingAlert(null); }} className="btn-outline">Cancel</button>
            <button
              onClick={submitAction}
              className={`btn text-white ${action === 'approved' ? 'bg-emerald-500' : 'bg-rose-500'}`}
            >
              {staffingAlert ? 'Override & Approve' : 'Confirm'}
            </button>
          </>
        }
      >
        <p className="text-sm text-on-surface-variant mb-3">
          {action === 'approved' ? 'Approve' : 'Reject'} this leave for <b>{selected?.employee?.name}</b>?
        </p>
        {staffingAlert && <StaffingAlert coverage={staffingAlert} />}
        <label className="label">
          {staffingAlert ? 'Override reason (required)' : 'Comment (optional)'}
        </label>
        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="input"
          placeholder={staffingAlert ? 'Explain why coverage can be overridden...' : 'Add a note for the employee...'}
        />
      </Modal>
    </div>
  );
}

const Row = ({ label, value }) => (
  <div className="flex justify-between border-b border-outline-variant/30 py-2 gap-2">
    <span className="text-on-surface-variant shrink-0">{label}</span>
    <span className="font-medium text-right truncate capitalize">{value}</span>
  </div>
);

const StaffingAlert = ({ coverage }) => (
  <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
    <div className="flex items-start gap-2">
      <FiAlertCircle className="mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-semibold">Department coverage limit reached</p>
        <p className="mt-1 text-xs">
          {coverage.department} must keep {coverage.minimumOnDuty} employee(s) on duty.
          This approval would breach that limit.
        </p>
        <div className="mt-2 space-y-1 text-xs">
          {coverage.violations.slice(0, 4).map((violation) => (
            <p key={`${violation.date}-${violation.session}`}>
              {violation.date} ({violation.sessionLabel}): {violation.availableStaff} available
            </p>
          ))}
        </div>
      </div>
    </div>
  </div>
);

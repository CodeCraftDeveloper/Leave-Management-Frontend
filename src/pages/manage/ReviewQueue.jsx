import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSearch, FiCheck, FiX, FiAlertCircle, FiDownload, FiFilter, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { ListSkeleton } from '../../components/Skeleton';
import Modal from '../../components/Modal';
import { getReviewQueue, actionLeave, exportReviewQueueExcel } from '../../services/manageService';
import { fmtDate, leaveTypeLabel, statusColors, leaveTypeColors } from '../../utils/format';

const statusOptions = ['pending', 'approved', 'rejected', 'all'];
const typeOptions = ['all', 'leave'];
const rangeOptions = [
  { value: 'all', label: 'All dates' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'Month wise' },
  { value: 'custom', label: 'Date from - date to' },
  { value: 'past', label: 'Past' },
  { value: 'present', label: 'Present' },
  { value: 'future', label: 'Future' },
];

const currentMonth = () => new Date().toISOString().slice(0, 7);
const toInputDate = (date) => date.toISOString().slice(0, 10);

const weekRange = () => {
  const start = new Date();
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { from: toInputDate(start), to: toInputDate(end) };
};

const buildRangeParams = (filters) => {
  if (filters.rangeMode === 'month') return { month: filters.month };
  if (filters.rangeMode === 'today') {
    const today = toInputDate(new Date());
    return { startDate: today, endDate: today };
  }
  if (filters.rangeMode === 'week') {
    const range = weekRange();
    return { startDate: range.from, endDate: range.to };
  }
  if (filters.rangeMode === 'custom') {
    return {
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    };
  }
  if (['past', 'present', 'future'].includes(filters.rangeMode)) {
    return { period: filters.rangeMode };
  }
  return {};
};

const rangeLabel = (filters) => {
  if (filters.rangeMode === 'month') return `Month ${filters.month}`;
  if (filters.rangeMode === 'today') return `Today ${toInputDate(new Date())}`;
  if (filters.rangeMode === 'week') {
    const range = weekRange();
    return `Week ${range.from} to ${range.to}`;
  }
  if (filters.rangeMode === 'custom') {
    return `${filters.startDate || 'Start'} to ${filters.endDate || 'End'}`;
  }
  return rangeOptions.find((option) => option.value === filters.rangeMode)?.label || 'All dates';
};

const activeFilterCount = (filters) => [
  filters.status !== 'all',
  filters.type !== 'all',
  filters.rangeMode !== 'all',
  Boolean(filters.search.trim()),
].filter(Boolean).length;

// Shared queue used by both dept_heads (their team) and heads (dept_heads' leaves).
// The server scopes the visible rows automatically based on the caller's role,
// so the component does not need to know which role it's rendering for.
export default function ReviewQueue({ title = 'Leave Requests', subtitle }) {
  const [searchParams] = useSearchParams();
  const initialStatus = statusOptions.includes(searchParams.get('status')) ? searchParams.get('status') : 'all';
  const initialType = typeOptions.includes(searchParams.get('type')) ? searchParams.get('type') : 'all';
  const initialRangeMode = rangeOptions.some((option) => option.value === searchParams.get('range'))
    ? searchParams.get('range')
    : 'all';
  const [filters, setFilters] = useState({
    status: initialStatus,
    type: initialType,
    rangeMode: initialRangeMode,
    month: searchParams.get('month') || currentMonth(),
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    search: '',
  });
  const [data, setData] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(null);
  const [comment, setComment] = useState('');
  const [staffingAlert, setStaffingAlert] = useState(null);

  const load = () => {
    setLoading(true);
    getReviewQueue({
      status: filters.status === 'all' ? undefined : filters.status,
      type: filters.type === 'all' ? undefined : filters.type,
      ...buildRangeParams(filters),
      search: filters.search || undefined,
      limit: 50,
    })
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(load, [filters.status, filters.type, filters.rangeMode, filters.month, filters.startDate, filters.endDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportReviewQueueExcel({
        status: filters.status === 'all' ? undefined : filters.status,
        type: filters.type === 'all' ? undefined : filters.type,
        ...buildRangeParams(filters),
        search: filters.search || undefined,
      });
      toast.success('Leave register exported');
    } catch {
      // The API interceptor already shows the failure reason.
    } finally {
      setExporting(false);
    }
  };

  const submitAction = async () => {
    const isStaffingOverride = action === 'approved' && !!staffingAlert;
    if (isStaffingOverride && !comment.trim()) {
      toast.error('Enter an override reason before approving this leave');
      return;
    }
    try {
      await actionLeave(selected._id, {
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
      <PageHeader
        title={title}
        subtitle={subtitle || 'All leave applications with statement-style filters and export'}
        action={(
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="btn-outline gap-2 text-xs sm:text-sm disabled:opacity-60"
          >
            <FiDownload />
            {exporting ? 'Exporting...' : 'Export Excel'}
          </button>
        )}
      />

      <div className="card p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            className="btn-outline h-10 gap-2 px-3 text-sm"
          >
            <FiFilter />
            Filters
            {activeFilterCount(filters) > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-on-primary">
                {activeFilterCount(filters)}
              </span>
            )}
          </button>
          <div className="flex flex-wrap gap-2 text-xs text-on-surface-variant">
            <span className="chip bg-surface-container-low border border-outline-variant/30">
              Showing {data.items?.length ?? 0} of {data.total ?? 0}
            </span>
            {filters.status !== 'all' && (
              <span className="chip bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
                {filters.status}
              </span>
            )}
            {filters.type !== 'all' && (
              <span className="chip bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-200">
                {leaveTypeLabel[filters.type]}
              </span>
            )}
            <span className="chip bg-surface-container-low border border-outline-variant/30">
              {rangeLabel(filters)}
            </span>
          </div>
        </div>
        {filtersOpen && (
          <div className="space-y-3 border-t border-outline-variant/30 pt-3">
            <form
              onSubmit={(e) => { e.preventDefault(); load(); setFiltersOpen(false); }}
              className="relative"
            >
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
              <input
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search by name, ID, email, or department"
                className="input pl-10 text-sm sm:text-base"
              />
            </form>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="input text-sm sm:text-base">
                {statusOptions.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
              <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className="input text-sm sm:text-base">
                {typeOptions.map((type) => (
                  <option key={type} value={type} className="capitalize">
                    {type === 'all' ? 'All types' : leaveTypeLabel[type]}
                  </option>
                ))}
              </select>
              <select value={filters.rangeMode} onChange={(e) => setFilters({ ...filters, rangeMode: e.target.value })} className="input text-sm sm:text-base">
                {rangeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                type="month"
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value || currentMonth(), rangeMode: 'month' })}
                className="input text-sm sm:text-base"
                aria-label="Month wise filter"
              />
              <button
                type="button"
                onClick={() => { load(); setFiltersOpen(false); }}
                className="btn-primary h-12 text-sm"
              >
                Apply filters
              </button>
            </div>
            {filters.rangeMode === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-3">
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <FiCalendar /> Date from
                  </span>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="input text-sm"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <FiCalendar /> Date to
                  </span>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="input text-sm"
                  />
                </label>
              </div>
            )}
          </div>
        )}
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
                    {l.employee?.role === 'dept_head' && (
                      <span className="chip text-[10px] bg-amber-100 text-amber-800 border border-amber-200">Dept Head</span>
                    )}
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
                <p className="text-on-surface-variant text-xs uppercase">Reviewer Comment</p>
                <p>{selected.adminComment}</p>
              </div>
            )}
            {selected.staffingOverride && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
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
  <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
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

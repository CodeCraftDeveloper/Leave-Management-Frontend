import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { FiEdit2, FiMail, FiPlus, FiSearch, FiSend, FiShield, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { ListSkeleton } from '../../components/Skeleton';
import Modal from '../../components/Modal';
import { createEmployee, deleteEmployee, getManagedHeads, updateEmployee } from '../../services/adminService';
import { getTeam, getWeeklyDigestPreview, listDepartments, sendWeeklyDigestNow } from '../../services/manageService';
import { useAuth } from '../../context/AuthContext';
import { isPrimarySuperAdmin, isSuperAdmin } from '../../utils/roles';
import { fmtDate } from '../../utils/format';

const emptyForm = {
  employeeId: '',
  name: '',
  email: '',
  phone: '',
  department: '',
  designation: '',
  joiningDate: '',
  password: '',
  approvalEmployeeIds: [],
};

const toForm = (head) => ({
  employeeId: head.employeeId || '',
  name: head.name || '',
  email: head.email || '',
  phone: head.phone || '',
  department: head.department || '',
  designation: head.designation || '',
  joiningDate: head.joiningDate?.slice(0, 10) || '',
  password: '',
  approvalEmployeeIds: head.assignedEmployeeIds || [],
});

export default function HeadAccounts() {
  const { user } = useAuth();
  if (!isSuperAdmin(user)) return <Navigate to="/head" replace />;
  return <HeadAccountsContent />;
}

function HeadAccountsContent() {
  const [heads, setHeads] = useState([]);
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [assignmentQuery, setAssignmentQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [sendingDigest, setSendingDigest] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [headList, team, departmentList, digestPreview] = await Promise.all([
        getManagedHeads(),
        getTeam({}),
        listDepartments(),
        getWeeklyDigestPreview().catch(() => null),
      ]);
      setHeads(headList.items || []);
      setStaff(team.items || []);
      setDepartments(departmentList.items || []);
      setDigest(digestPreview);
    } catch {
      // The API interceptor displays request errors.
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // The primary overall head (HEAD001) owns this page but is not a managed
  // Head, so it is kept out of the list. Other super admins stay visible and
  // read-only, matching the edit/remove gating below.
  const managedHeads = useMemo(
    () => heads.filter((head) => !isPrimarySuperAdmin(head)),
    [heads]
  );

  const filteredHeads = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return managedHeads;
    return managedHeads.filter((head) => [
      head.name, head.employeeId, head.email, head.notificationEmail, head.department,
    ].some((field) => String(field || '').toLowerCase().includes(value)));
  }, [managedHeads, query]);

  const visibleStaff = useMemo(() => {
    const value = assignmentQuery.trim().toLowerCase();
    return staff.filter((employee) => !value || [
      employee.name, employee.employeeId, employee.department,
    ].some((field) => String(field || '').toLowerCase().includes(value)));
  }, [staff, assignmentQuery]);

  const staffGroups = useMemo(() => {
    const groups = new Map();
    visibleStaff.forEach((employee) => {
      const department = employee.department || 'Unassigned';
      if (!groups.has(department)) groups.set(department, []);
      groups.get(department).push(employee);
    });
    return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right));
  }, [visibleStaff]);

  const selectedIds = useMemo(() => new Set(form.approvalEmployeeIds), [form.approvalEmployeeIds]);
  const homeDepartmentOptions = useMemo(() => [...new Set([
    ...departments.map((department) => department.name),
    ...staff.map((employee) => employee.department),
  ].filter(Boolean))].sort((left, right) => left.localeCompare(right)), [departments, staff]);
  const editableCount = managedHeads.filter((head) => !head.isSuperAdmin).length;

  const closeEditor = () => {
    setEditor(null);
    setForm(emptyForm);
    setAssignmentQuery('');
  };

  const openCreate = () => {
    setForm(emptyForm);
    setAssignmentQuery('');
    setEditor({ mode: 'create' });
  };

  const openEdit = (head) => {
    setForm(toForm(head));
    setAssignmentQuery('');
    setEditor({ mode: 'edit', head });
  };

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const toggleAssignment = (id) => setForm((current) => ({
    ...current,
    approvalEmployeeIds: current.approvalEmployeeIds.includes(id)
      ? current.approvalEmployeeIds.filter((selected) => selected !== id)
      : [...current.approvalEmployeeIds, id],
  }));

  const selectShown = () => setForm((current) => ({
    ...current,
    approvalEmployeeIds: [...new Set([...current.approvalEmployeeIds, ...visibleStaff.map((employee) => employee._id)])],
  }));

  const save = async () => {
    if (!editor || saving) return;
    if (!form.employeeId.trim() || !form.name.trim() || !form.department.trim()) {
      toast.error('Head ID, name and home department are required');
      return;
    }
    if (editor.mode === 'create' && !form.email.trim()) {
      toast.error('A login email is required for a new Head');
      return;
    }
    if ((editor.mode === 'create' || form.password) && form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (form.password && !form.email.trim()) {
      toast.error('Add a login email before resetting the password');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        employeeId: form.employeeId,
        name: form.name,
        email: form.email,
        phone: form.phone,
        department: form.department,
        designation: form.designation,
        joiningDate: form.joiningDate || undefined,
        role: 'head',
        approvalEmployeeIds: form.approvalEmployeeIds,
        ...(editor.mode === 'create' || form.password ? { password: form.password } : {}),
      };
      const result = editor.mode === 'create'
        ? await createEmployee(payload)
        : await updateEmployee(editor.head._id, payload);
      if (result.passwordResetEmail === 'failed') {
        toast.error('Head saved, but the password email failed. Check mail delivery and retry.');
        load();
        return;
      }
      toast.success(editor.mode === 'create'
        ? 'Head account created with approval assignments'
        : result.passwordResetEmail === 'sent'
          ? 'Head updated and new password emailed'
          : 'Head account and assignments updated');
      closeEditor();
      load();
    } catch {
      // The API interceptor displays request errors.
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteEmployee(deleteTarget._id);
      toast.success('Head account removed');
      setDeleteTarget(null);
      load();
    } catch {
      // The API interceptor displays request errors.
    } finally {
      setDeleting(false);
    }
  };

  const sendDigest = async () => {
    setSendingDigest(true);
    try {
      const result = await sendWeeklyDigestNow();
      toast.success(result.message || 'Weekly digest sent');
    } catch {
      // The API interceptor displays request errors.
    } finally {
      setSendingDigest(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Heads"
        subtitle="Manage Head logins and the employees whose leave requests they review."
        action={<button type="button" onClick={openCreate} disabled={loading || loadError} className="btn-primary h-10 gap-2 px-4 text-sm"><FiPlus /> Add Head</button>}
      />

      <section className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Approved leave digest</p>
          <p className="text-xs text-on-surface-variant mt-1">
            Monday mail to Heads includes approved leaves for the current week.
            {digest && ` ${fmtDate(digest.weekStart)} to ${fmtDate(digest.weekEnd)} · ${digest.leaves?.length ?? 0} approved leave(s).`}
          </p>
        </div>
        <button type="button" onClick={sendDigest} disabled={sendingDigest} className="btn-outline h-10 gap-2 text-sm shrink-0">
          <FiSend /> {sendingDigest ? 'Sending...' : 'Send weekly digest'}
        </button>
      </section>

      <div className="card p-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="relative flex-1 min-w-0">
          <span className="sr-only">Search Heads</span>
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="input pl-9 text-sm" placeholder="Search name, ID, email or department" />
        </label>
        <span className="text-xs text-on-surface-variant sm:shrink-0">{editableCount} managed Head{editableCount === 1 ? '' : 's'}</span>
      </div>

      {loading ? <ListSkeleton count={4} /> : loadError ? (
        <div className="card p-5 text-sm text-on-surface-variant flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p>Head accounts could not be loaded.</p>
          <button type="button" onClick={load} className="btn-outline text-sm">Try again</button>
        </div>
      ) : filteredHeads.length === 0 ? (
        <EmptyState title={query ? 'No Heads found' : 'No Head accounts'} subtitle={query ? 'Try a different search.' : 'Add a Head to set up approvals.'} />
      ) : (
        <section className="card overflow-hidden divide-y divide-outline-variant/40" aria-label="Head accounts">
          {filteredHeads.map((head) => (
            <article key={head._id} className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex items-start gap-3 min-w-0 lg:w-[30%]">
                <div className="w-11 h-11 rounded-full bg-primary-container text-on-primary-container border border-outline-variant/50 grid place-items-center font-semibold shrink-0">
                  {head.name?.[0] || 'H'}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{head.name}</p>
                  <p className="text-xs text-on-surface-variant">{head.employeeId} · {head.department}</p>
                  <p className="text-xs text-on-surface-variant truncate inline-flex items-center gap-1 mt-1">
                    <FiMail className="shrink-0" /> {head.email || 'Login email not set'}
                  </p>
                </div>
              </div>
              <div className="min-w-0 flex-1 text-xs text-on-surface-variant">
                {head.isSuperAdmin ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-primary"><FiShield /> Super Admin · global access</span>
                ) : (
                  <>
                    <p className="font-medium text-on-surface">{head.assignedEmployeeIds?.length || 0} assigned employee{head.assignedEmployeeIds?.length === 1 ? '' : 's'}</p>
                    <p className="mt-1 line-clamp-2">{head.assignedDepartments?.length ? head.assignedDepartments.join(', ') : 'No approval assignments yet'}</p>
                    {head.notificationEmail && head.notificationEmail !== head.email && <p className="mt-1 truncate">Approval email: {head.notificationEmail}</p>}
                  </>
                )}
              </div>
              {!head.isSuperAdmin && (
                <div className="grid grid-cols-2 gap-2 lg:w-44 shrink-0">
                  <button type="button" onClick={() => openEdit(head)} className="btn-outline text-xs gap-1"><FiEdit2 /> Edit</button>
                  <button type="button" onClick={() => setDeleteTarget(head)} className="btn border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs gap-1"><FiTrash2 /> Remove</button>
                </div>
              )}
            </article>
          ))}
        </section>
      )}

      <Modal
        open={!!editor}
        onClose={saving ? () => {} : closeEditor}
        title={editor?.mode === 'create' ? 'Add Head' : 'Edit Head'}
        size="lg"
        footer={<>
          <button type="button" onClick={closeEditor} disabled={saving} className="btn-outline">Cancel</button>
          <button type="submit" form="head-editor-form" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editor?.mode === 'create' ? 'Add Head' : 'Save Changes'}</button>
        </>}
      >
        <form id="head-editor-form" onSubmit={(event) => { event.preventDefault(); save(); }} className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-3">Account details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Head ID" value={form.employeeId} onChange={(value) => updateForm('employeeId', value)} required />
              <Field label="Full Name" value={form.name} onChange={(value) => updateForm('name', value)} required />
              <Field label="Login Email" type="email" value={form.email} onChange={(value) => updateForm('email', value)} required={editor?.mode === 'create'} />
              <Field label="Phone" type="tel" value={form.phone} onChange={(value) => updateForm('phone', value)} />
              <Field label="Home Department" value={form.department} onChange={(value) => updateForm('department', value)} list="head-home-departments" required />
              <datalist id="head-home-departments">
                {homeDepartmentOptions.map((department) => <option key={department} value={department} />)}
              </datalist>
              <Field label="Designation" value={form.designation} onChange={(value) => updateForm('designation', value)} />
              <Field label="Joining Date" type="date" value={form.joiningDate} onChange={(value) => updateForm('joiningDate', value)} />
              <Field label={editor?.mode === 'create' ? 'Initial Password' : 'Reset Password'} type="password" value={form.password} onChange={(value) => updateForm('password', value)} autoComplete="new-password" />
            </div>
            {editor?.mode === 'edit' && editor.head.notificationEmail && editor.head.notificationEmail !== editor.head.email && (
              <p className="text-xs text-on-surface-variant mt-2">Approval mail is routed through {editor.head.notificationEmail}. Login email can be managed separately.</p>
            )}
            <p className="text-xs text-on-surface-variant mt-2">
              {editor?.mode === 'create' ? 'Set an initial password of at least 6 characters.' : 'Leave password blank to keep it. A reset password is emailed to the Head with instructions to change it in Profile.'}
            </p>
          </div>

          <div className="border-t border-outline-variant/40 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-3">
              <div>
                <p className="text-sm font-semibold">Approval assignments</p>
                <p className="text-xs text-on-surface-variant mt-1">Select the employees whose leave requests this Head can review. Department links follow these assignments.</p>
              </div>
              <span className="text-xs font-semibold text-primary">{form.approvalEmployeeIds.length} selected</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <label className="relative flex-1 min-w-0">
                <span className="sr-only">Search employees to assign</span>
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                <input value={assignmentQuery} onChange={(event) => setAssignmentQuery(event.target.value)} className="input pl-9 text-sm" placeholder="Find employees or departments" />
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={selectShown} disabled={!visibleStaff.length} className="btn-outline text-xs">Select shown</button>
                <button type="button" onClick={() => updateForm('approvalEmployeeIds', [])} disabled={!form.approvalEmployeeIds.length} className="btn-outline text-xs">Clear all</button>
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-outline-variant/50 divide-y divide-outline-variant/30">
              {!visibleStaff.length ? <p className="p-4 text-sm text-on-surface-variant">No employees match this search.</p> : staffGroups.map(([department, employees]) => (
                <div key={department}>
                  <p className="px-3 py-2 bg-surface-container-low text-xs font-semibold text-on-surface-variant">{department} · {employees.length}</p>
                  {employees.map((employee) => (
                    <label key={employee._id} className="flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer hover:bg-surface-container-low">
                      <input type="checkbox" className="accent-primary w-4 h-4 shrink-0" checked={selectedIds.has(employee._id)} onChange={() => toggleAssignment(employee._id)} />
                      <span className="min-w-0 truncate"><span className="font-medium">{employee.name}</span> <span className="text-on-surface-variant">({employee.employeeId})</span></span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
            {!form.approvalEmployeeIds.length && <p className="text-xs text-amber-700 mt-2">This Head will not see employee leave requests until employees are assigned.</p>}
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={deleting ? () => {} : () => setDeleteTarget(null)}
        title="Remove Head"
        footer={<>
          <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} className="btn-outline">Cancel</button>
          <button type="button" onClick={remove} disabled={deleting} className="btn bg-rose-600 text-white">{deleting ? 'Removing...' : 'Remove permanently'}</button>
        </>}
      >
        <p className="text-sm text-on-surface-variant">
          Remove <b>{deleteTarget?.name}</b>? This deletes the Head account and its related records, and removes its approval routing from employees. This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', ...props }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="input text-sm" {...props} />
    </label>
  );
}

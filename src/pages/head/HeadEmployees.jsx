import { useEffect, useState } from 'react';
import { FiEdit2, FiMail, FiPlus, FiSearch, FiShield, FiTrash2, FiUserMinus, FiUserCheck, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { ListSkeleton } from '../../components/Skeleton';
import Modal from '../../components/Modal';
import {
  getTeam,
  updateEmployeeRole,
  getWeeklyDigestPreview,
  sendWeeklyDigestNow,
} from '../../services/manageService';
import { createEmployee, deleteEmployee, updateEmployee } from '../../services/adminService';
import { fmtDate } from '../../utils/format';

const roleLabel = {
  employee: 'Employee',
  dept_head: 'Department Head',
};

const emptyForm = {
  employeeId: '',
  name: '',
  email: '',
  phone: '',
  department: '',
  designation: '',
  joiningDate: '',
  password: '',
};

const toEmployeeForm = (employee) => ({
  employeeId: employee.employeeId || '',
  name: employee.name || '',
  email: employee.email || '',
  phone: employee.phone || '',
  department: employee.department || '',
  designation: employee.designation || '',
  joiningDate: employee.joiningDate ? employee.joiningDate.slice(0, 10) : '',
  password: '',
});

const requiredFields = ['employeeId', 'name', 'email', 'department', 'designation'];

export default function HeadEmployees() {
  const [search, setSearch] = useState('');
  const [data, setData] = useState({ items: [] });
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleTarget, setRoleTarget] = useState(null);
  const [employeeModal, setEmployeeModal] = useState(null);
  const [employeeForm, setEmployeeForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [savingRole, setSavingRole] = useState(false);
  const [savingEmployee, setSavingEmployee] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState(false);
  const [sendingDigest, setSendingDigest] = useState(false);

  const load = (q = search) => {
    setLoading(true);
    Promise.all([
      getTeam({ search: q || undefined }),
      getWeeklyDigestPreview().catch(() => null),
    ])
      .then(([team, digestPreview]) => {
        setData(team);
        setDigest(digestPreview);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmRoleChange = async () => {
    if (!roleTarget) return;
    setSavingRole(true);
    try {
      const nextRole = roleTarget.employee.role === 'dept_head' ? 'employee' : 'dept_head';
      const result = await updateEmployeeRole(roleTarget.employee._id, nextRole);
      toast.success(result.message || 'Role updated');
      setRoleTarget(null);
      load(search);
    } finally {
      setSavingRole(false);
    }
  };

  const sendDigest = async () => {
    setSendingDigest(true);
    try {
      const result = await sendWeeklyDigestNow();
      toast.success(result.message || 'Weekly digest sent');
    } finally {
      setSendingDigest(false);
    }
  };

  const openCreate = () => {
    setEmployeeForm(emptyForm);
    setEmployeeModal({ mode: 'create' });
  };

  const openEdit = (employee) => {
    setEmployeeForm(toEmployeeForm(employee));
    setEmployeeModal({ mode: 'edit', employee });
  };

  const updateForm = (field, value) => {
    setEmployeeForm((current) => ({ ...current, [field]: value }));
  };

  const submitEmployee = async () => {
    const missing = requiredFields.find((field) => !employeeForm[field].trim());
    if (missing) {
      toast.error('Employee ID, name, email, department and designation are required');
      return;
    }
    if (employeeModal?.mode === 'create' && employeeForm.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSavingEmployee(true);
    try {
      const payload = {
        employeeId: employeeForm.employeeId,
        name: employeeForm.name,
        email: employeeForm.email,
        phone: employeeForm.phone,
        department: employeeForm.department,
        designation: employeeForm.designation,
        joiningDate: employeeForm.joiningDate || undefined,
      };
      if (employeeModal.mode === 'create') {
        await createEmployee({ ...payload, password: employeeForm.password });
        toast.success('Employee added');
      } else {
        await updateEmployee(employeeModal.employee._id, payload);
        toast.success('Employee updated');
      }
      setEmployeeModal(null);
      setEmployeeForm(emptyForm);
      load(search);
    } finally {
      setSavingEmployee(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingEmployee(true);
    try {
      const result = await deleteEmployee(deleteTarget._id);
      toast.success(result.message || 'Employee removed');
      setDeleteTarget(null);
      load(search);
    } finally {
      setDeletingEmployee(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Employees"
        subtitle={`${data.total ?? data.items.length} active employees and department heads`}
        action={(
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={openCreate}
              className="btn-primary h-10 gap-2 px-3 text-xs sm:text-sm"
            >
              <FiPlus />
              Add Employee
            </button>
            <button
              type="button"
              onClick={sendDigest}
              disabled={sendingDigest}
              className="btn-outline h-10 text-xs sm:text-sm gap-2"
            >
              <FiSend />
              {sendingDigest ? 'Sending...' : 'Send weekly digest'}
            </button>
          </div>
        )}
      />

      <section className="card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Approved leave digest</p>
            <p className="text-xs text-on-surface-variant mt-1">
              Monday mail to heads includes approved leaves for the current week.
            </p>
          </div>
          <div className="text-xs text-on-surface-variant sm:text-right">
            <p>{digest ? `${fmtDate(digest.weekStart)} to ${fmtDate(digest.weekEnd)}` : 'Digest window unavailable'}</p>
            <p>{digest?.leaves?.length ?? 0} approved leave(s)</p>
          </div>
        </div>
      </section>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          load(search);
        }}
        className="card p-3 relative"
      >
        <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="input pl-10 text-sm sm:text-base"
          placeholder="Search by name, ID or email"
        />
      </form>

      {loading ? (
        <ListSkeleton count={5} />
      ) : data.items.length === 0 ? (
        <EmptyState title="No employees found" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.items
            .filter((employee) => employee.role !== 'head')
            .map((employee) => (
              <article key={employee._id} className="card p-4 min-w-0">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container border border-outline-variant/50 grid place-items-center font-semibold shrink-0">
                    {employee.name?.[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-sm sm:text-base font-semibold truncate">{employee.name}</p>
                      {employee.role === 'dept_head' && (
                        <FiShield className="text-amber-500 shrink-0" title="Department Head" />
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs text-on-surface-variant truncate">
                      {employee.employeeId} - {employee.department}
                    </p>
                    <p className="text-[11px] sm:text-xs text-on-surface-variant/75 truncate mt-1">
                      {employee.designation}
                    </p>
                    <p className="text-[11px] sm:text-xs text-on-surface-variant/75 truncate inline-flex items-center gap-1 mt-2">
                      <FiMail className="shrink-0" /> {employee.email}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="chip text-[11px] bg-surface-container-low border border-outline-variant/30">
                        {roleLabel[employee.role] || employee.role}
                      </span>
                      <span className={`chip text-[11px] border ${employee.emailVerified ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {employee.emailVerified ? 'Email verified' : 'Email pending'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRoleTarget({ employee })}
                  className="btn-outline w-full mt-3 text-xs"
                >
                  {employee.role === 'dept_head' ? <FiUserMinus /> : <FiUserCheck />}
                  {employee.role === 'dept_head' ? 'Remove Department Head' : 'Make Department Head'}
                </button>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => openEdit(employee)}
                    className="btn-outline text-xs gap-1 px-2"
                  >
                    <FiEdit2 /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(employee)}
                    className="btn border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs gap-1 px-2"
                  >
                    <FiTrash2 /> Remove
                  </button>
                </div>
              </article>
            ))}
        </div>
      )}

      <Modal
        open={!!roleTarget}
        onClose={() => setRoleTarget(null)}
        title={roleTarget?.employee?.role === 'dept_head' ? 'Remove Department Head' : 'Assign Department Head'}
        footer={(
          <>
            <button type="button" onClick={() => setRoleTarget(null)} className="btn-outline">
              Cancel
            </button>
            <button type="button" onClick={confirmRoleChange} disabled={savingRole} className="btn-primary">
              {savingRole ? 'Saving...' : 'Confirm'}
            </button>
          </>
        )}
      >
        <p className="text-sm text-on-surface-variant">
          {roleTarget?.employee?.role === 'dept_head'
            ? `Remove ${roleTarget.employee.name} from department-head access?`
            : `Make ${roleTarget?.employee?.name} the department head for ${roleTarget?.employee?.department}?`}
        </p>
      </Modal>

      <Modal
        open={!!employeeModal}
        onClose={() => { setEmployeeModal(null); setEmployeeForm(emptyForm); }}
        title={employeeModal?.mode === 'create' ? 'Add Employee' : 'Edit Employee'}
        footer={(
          <>
            <button
              type="button"
              onClick={() => { setEmployeeModal(null); setEmployeeForm(emptyForm); }}
              className="btn-outline"
            >
              Cancel
            </button>
            <button type="button" onClick={submitEmployee} disabled={savingEmployee} className="btn-primary">
              {savingEmployee ? 'Saving...' : employeeModal?.mode === 'create' ? 'Add Employee' : 'Save Changes'}
            </button>
          </>
        )}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Employee ID" value={employeeForm.employeeId} onChange={(value) => updateForm('employeeId', value)} />
          <Field label="Full Name" value={employeeForm.name} onChange={(value) => updateForm('name', value)} />
          <Field label="Email" type="email" value={employeeForm.email} onChange={(value) => updateForm('email', value)} />
          <Field label="Phone" value={employeeForm.phone} onChange={(value) => updateForm('phone', value)} />
          <Field label="Department" value={employeeForm.department} onChange={(value) => updateForm('department', value)} />
          <Field label="Designation" value={employeeForm.designation} onChange={(value) => updateForm('designation', value)} />
          <Field label="Joining Date" type="date" value={employeeForm.joiningDate} onChange={(value) => updateForm('joiningDate', value)} />
          {employeeModal?.mode === 'create' && (
            <Field label="Temporary Password" type="password" value={employeeForm.password} onChange={(value) => updateForm('password', value)} />
          )}
        </div>
        {employeeModal?.mode === 'edit' && (
          <p className="mt-3 text-xs text-on-surface-variant">
            Password changes stay with the employee profile flow. Editing email will require the employee to verify the new address.
          </p>
        )}
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove Employee"
        footer={(
          <>
            <button type="button" onClick={() => setDeleteTarget(null)} className="btn-outline">
              Cancel
            </button>
            <button type="button" onClick={confirmDelete} disabled={deletingEmployee} className="btn bg-rose-600 text-white">
              {deletingEmployee ? 'Removing...' : 'Remove'}
            </button>
          </>
        )}
      >
        <p className="text-sm text-on-surface-variant">
          Remove <b>{deleteTarget?.name}</b> from active employees? Their existing leave history will remain in reports.
        </p>
      </Modal>
    </div>
  );
}

const Field = ({ label, value, onChange, type = 'text' }) => (
  <label className="block">
    <span className="label">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="input text-sm"
    />
  </label>
);

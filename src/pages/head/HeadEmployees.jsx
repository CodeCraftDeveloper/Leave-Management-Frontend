import { useEffect, useMemo, useState } from 'react';
import {
  FiCalendar,
  FiCheckCircle,
  FiDownload,
  FiEdit2,
  FiMail,
  FiPlus,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUsers,
  FiUploadCloud,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { ListSkeleton } from '../../components/Skeleton';
import Modal from '../../components/Modal';
import ApplyOnBehalfModal from '../../components/ApplyOnBehalfModal';
import BulkImportModal from '../../components/BulkImportModal';
import {
  getTeam,
  listDepartments,
} from '../../services/manageService';
import { createEmployee, deleteEmployee, updateEmployee, listHeads, exportEmployeesExcel } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { isSuperAdmin, SUPERADMIN_EMAILS } from '../../utils/roles';

const roleLabel = {
  employee: 'Employee',
  dept_head: 'Employee',
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
  headNotificationEmails: [],
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
  headNotificationEmails: (employee.headNotificationEmails || []).map((email) =>
    String(email || '').toLowerCase()
  ),
});

// The login email or seeded notification email used to route this Head's
// approvals — stored on the employee's headNotificationEmails.
const headEmailValue = (head) =>
  String(head?.notificationEmail || head?.email || '').toLowerCase();

// Email and designation are optional at creation — an admin can fill them in
// later, so they're left out of the required set.
const requiredFields = ['employeeId', 'name', 'department'];

export default function HeadEmployees() {
  const { user } = useAuth();
  const superAdmin = isSuperAdmin(user);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [data, setData] = useState({ items: [] });
  const [departments, setDepartments] = useState([]);
  const [headDirectory, setHeadDirectory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeModal, setEmployeeModal] = useState(null);
  const [employeeForm, setEmployeeForm] = useState(emptyForm);
  const [applyLeaveTarget, setApplyLeaveTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportOrder, setExportOrder] = useState('asc');
  const [savingEmployee, setSavingEmployee] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState(false);

  const load = (q = search, dept = departmentFilter) => {
    setLoading(true);
    Promise.all([
      getTeam({
        search: q || undefined,
        department: dept || undefined,
      }),
      listDepartments(),
      // Head directory powers the reporting-head selector; available to every
      // head (the super admin included), not just the super admin.
      listHeads().catch(() => ({ items: [] })),
    ])
      .then(([team, departmentList, headList]) => {
        setData(team);
        setDepartments(departmentList.items || []);
        setHeadDirectory(headList.items || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportExcel = async () => {
    setExporting(true);
    try {
      await exportEmployeesExcel({ sort: exportOrder });
      toast.success(`Employees exported (Employee ID ${exportOrder === 'asc' ? 'A→Z' : 'Z→A'})`);
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
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

  const toggleReportingHead = (email) => {
    if (!email) return;
    setEmployeeForm((current) => {
      const selected = new Set(current.headNotificationEmails);
      if (selected.has(email)) selected.delete(email);
      else selected.add(email);
      return { ...current, headNotificationEmails: [...selected] };
    });
  };

  const submitEmployee = async () => {
    const missing = requiredFields.find((field) => !employeeForm[field].trim());
    if (missing) {
      toast.error('Employee ID, name and department are required');
      return;
    }
    if ((employeeModal?.mode === 'create' || (superAdmin && employeeForm.password)) && employeeForm.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (superAdmin && employeeModal?.mode === 'edit' && employeeForm.password && !employeeForm.email.trim()) {
      toast.error('Add an employee email before resetting their password');
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
        headNotificationEmails: employeeForm.headNotificationEmails,
      };
      if (employeeModal.mode === 'create') {
        await createEmployee({ ...payload, role: 'employee', password: employeeForm.password });
        toast.success('Employee added');
      } else {
        const updatedEmployee = await updateEmployee(employeeModal.employee._id, {
          ...payload,
          ...(superAdmin && employeeForm.password ? { password: employeeForm.password } : {}),
        });
        if (updatedEmployee.passwordResetEmail === 'failed') {
          toast.error('Password changed, but the email could not be sent. Check mail delivery and retry.');
          load(search);
          return;
        } else {
          toast.success(updatedEmployee.passwordResetEmail === 'sent'
            ? 'Employee updated and new password emailed'
            : 'Employee updated');
        }
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

  const departmentByName = useMemo(() => {
    const map = new Map();
    for (const department of departments) map.set(department.name, department);
    return map;
  }, [departments]);

  const visibleEmployees = useMemo(
    () => data.items.filter((employee) => employee.role !== 'head'),
    [data.items]
  );

  // The overall super admin (e.g. HEAD001) is never a departmental reporting
  // head. Keep it out of every reporting-head picker — the account still exists
  // and approves globally, it's just hidden from these assignment lists.
  const assignableHeads = headDirectory.filter((head) => {
    const emails = [head.email, head.notificationEmail].map((value) =>
      String(value || '').toLowerCase()
    );
    return !emails.some((email) => SUPERADMIN_EMAILS.includes(email));
  });

  const verificationRows = useMemo(
    () => visibleEmployees.map((employee) => {
      const department = departmentByName.get(employee.department);
      return {
        employee,
        department,
        approvalEmails: employee.headNotificationEmails || [],
        approvalHeads: (employee.headNotificationEmails || []).map((email) => ({
          _id: email,
          name: email,
          email,
        })),
      };
    }),
    [departmentByName, visibleEmployees]
  );

  const verificationCounts = useMemo(() => ({
    missingDepartment: verificationRows.filter((row) => !row.department).length,
    missingHeads: verificationRows.filter((row) => row.approvalEmails.length === 0).length,
  }), [verificationRows]);

  const departmentOptions = useMemo(
    () => departments.map((department) => department.name).sort((a, b) => a.localeCompare(b)),
    [departments]
  );

  const headLabel = (head) => {
    const email = head.notificationEmail || head.email;
    if (head.name === email) return email;
    return `${head.name}${head.employeeId ? ` (${head.employeeId})` : ''}${email ? ` - ${email}` : ''}`;
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Employees"
        subtitle={`${visibleEmployees.length} active employee${visibleEmployees.length === 1 ? '' : 's'}`}
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
              onClick={() => setImportOpen(true)}
              className="btn-outline h-10 gap-2 px-3 text-xs sm:text-sm"
            >
              <FiUploadCloud />
              Import Excel
            </button>
            <button
              type="button"
              onClick={exportExcel}
              disabled={exporting}
              className="btn-outline h-10 gap-2 px-3 text-xs sm:text-sm"
            >
              <FiDownload />
              {exporting ? 'Exporting...' : 'Export Excel'}
            </button>
            <select
              value={exportOrder}
              onChange={(event) => setExportOrder(event.target.value)}
              className="input text-xs h-10 lg:max-w-[8.5rem]"
              title="Sort order by Employee ID"
            >
              <option value="asc">ID Ascending</option>
              <option value="desc">ID Descending</option>
            </select>
          </div>
        )}
      />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          load(search, departmentFilter);
        }}
        className="card p-3 flex flex-col lg:flex-row gap-3"
      >
        <label className="relative flex-1 min-w-0">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="input pl-9 text-sm sm:text-base"
            placeholder="Search by name, ID or email"
          />
        </label>
        <select
          value={departmentFilter}
          onChange={(event) => {
            const nextDepartment = event.target.value;
            setDepartmentFilter(nextDepartment);
            load(search, nextDepartment);
          }}
          className="input text-sm lg:max-w-xs"
        >
          <option value="">All departments</option>
          {departmentOptions.map((department) => (
            <option key={department} value={department}>{department}</option>
          ))}
        </select>
      </form>

      {loading ? (
        <ListSkeleton count={5} />
      ) : data.items.length === 0 ? (
        <EmptyState title="No employees found" />
      ) : (
        <>
          <section className="grid sm:grid-cols-3 gap-3">
            <div className="card p-4 flex items-center gap-3">
              <FiUsers className="text-primary-600 shrink-0" />
              <div>
                <p className="text-lg font-bold">{visibleEmployees.length}</p>
                <p className="text-xs text-on-surface-variant">Visible employees</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <FiCheckCircle className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-lg font-bold">
                  {Math.max(0, visibleEmployees.length - verificationCounts.missingDepartment)}
                </p>
                <p className="text-xs text-on-surface-variant">Department links found</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <FiShield className="text-amber-500 shrink-0" />
              <div>
                <p className="text-lg font-bold">
                  {Math.max(0, visibleEmployees.length - verificationCounts.missingHeads)}
                </p>
                <p className="text-xs text-on-surface-variant">Head mappings found</p>
              </div>
            </div>
          </section>

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {verificationRows.map(({ employee, department, approvalHeads }) => (
              <article key={employee._id} className="card p-4 min-w-0">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container border border-outline-variant/50 grid place-items-center font-semibold shrink-0">
                    {employee.name?.[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-sm sm:text-base font-semibold truncate">{employee.name}</p>
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
                <div className="mt-4 border-t border-outline-variant/40 pt-3 space-y-3">
                  <div>
                    <p className="text-[11px] uppercase text-on-surface-variant">Department group</p>
                    <p className={`text-sm font-medium ${department ? 'text-on-surface' : 'text-rose-600'}`}>
                      {department?.name || 'Missing department group'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase text-on-surface-variant">Approval heads</p>
                    {approvalHeads.length ? (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {approvalHeads.map((head) => (
                          <span
                            key={head._id}
                            className="chip text-[11px] bg-primary-container text-on-primary-container border border-outline-variant/30 pr-1"
                          >
                            <span>{headLabel(head)}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-rose-600">No approval head assigned</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {superAdmin && (
                    <button
                      type="button"
                      onClick={() => setApplyLeaveTarget(employee)}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10"
                    >
                      <FiCalendar className="w-3.5 h-3.5" /> Apply Leave
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(employee)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-xs font-medium text-on-surface-variant transition hover:bg-surface-container"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(employee)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 transition hover:bg-rose-100"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

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
          <SelectField
            label="Department"
            value={employeeForm.department}
            onChange={(value) => updateForm('department', value)}
            options={departmentOptions.map((department) => ({ value: department, label: department }))}
          />
          <Field label="Designation" value={employeeForm.designation} onChange={(value) => updateForm('designation', value)} />
          <Field label="Joining Date" type="date" value={employeeForm.joiningDate} onChange={(value) => updateForm('joiningDate', value)} />
          {employeeModal?.mode === 'create' && (
            <Field label="Temporary Password" type="password" value={employeeForm.password} onChange={(value) => updateForm('password', value)} />
          )}
        </div>

        {superAdmin && employeeModal?.mode === 'edit' && (
          <div className="mt-4">
            <Field
              label="Reset Password"
              type="password"
              value={employeeForm.password}
              onChange={(value) => updateForm('password', value)}
              autoComplete="new-password"
            />
            <p className="mt-1.5 text-xs text-on-surface-variant">
              Leave blank to keep the current password. New passwords must have at least 6 characters.{' '}
              When saved, the new password will be emailed to the employee, with instructions to change it in Profile.
            </p>
          </div>
        )}

        <div className="mt-4">
          <span className="label">Reporting Head(s) for leave approval</span>
            <p className="text-xs text-on-surface-variant mb-2">
              Select the Head(s) who receive and approve this employee&apos;s leave requests.
            </p>
            <div className="max-h-48 overflow-auto rounded-lg border border-outline-variant/50 divide-y divide-outline-variant/30">
              {assignableHeads.length === 0 ? (
                <p className="text-xs text-on-surface-variant p-3">No Head accounts available to assign.</p>
              ) : (
                assignableHeads.map((head) => {
                  const value = headEmailValue(head);
                  const checked = employeeForm.headNotificationEmails.includes(value);
                  return (
                    <label
                      key={head._id}
                      className={`flex items-center gap-2.5 p-2.5 text-sm cursor-pointer hover:bg-surface-container-low ${value ? '' : 'opacity-50 cursor-not-allowed'}`}
                    >
                      <input
                        type="checkbox"
                        className="accent-primary w-4 h-4 shrink-0"
                        checked={checked}
                        disabled={!value}
                        onChange={() => toggleReportingHead(value)}
                      />
                      <span className="min-w-0">
                        <span className="font-medium">{head.name}</span>
                        {head.employeeId && (
                          <span className="text-on-surface-variant"> ({head.employeeId})</span>
                        )}
                        <span className="text-on-surface-variant"> — {value || 'no routing email'}</span>
                      </span>
                    </label>
                  );
                })
              )}
            </div>
            {employeeForm.headNotificationEmails.length === 0 && (
              <p className="mt-1.5 text-xs text-amber-600">
                No reporting head assigned — this employee&apos;s leave requests won&apos;t route to anyone.
              </p>
            )}
        </div>

        {employeeModal?.mode === 'edit' && (
          <p className="mt-3 text-xs text-on-surface-variant">
            {!superAdmin && 'Employees can change their password from Profile. '}
            Editing email will require the employee to verify the new address.
          </p>
        )}
      </Modal>

      <ApplyOnBehalfModal
        open={!!applyLeaveTarget}
        onClose={() => setApplyLeaveTarget(null)}
        employee={applyLeaveTarget}
        onSuccess={() => load(search, departmentFilter)}
      />

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Employee"
        footer={(
          <>
            <button type="button" onClick={() => setDeleteTarget(null)} className="btn-outline">
              Cancel
            </button>
            <button type="button" onClick={confirmDelete} disabled={deletingEmployee} className="btn bg-rose-600 text-white">
              {deletingEmployee ? 'Deleting...' : 'Delete permanently'}
            </button>
          </>
        )}
      >
        <p className="text-sm text-on-surface-variant">
          Permanently delete <b>{deleteTarget?.name}</b>? This removes the employee along with all of their
          leave, attendance, payroll and salary records. This action cannot be undone.
        </p>
      </Modal>

      <BulkImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => load(search, departmentFilter)}
      />
    </div>
  );
}

const Field = ({ label, value, onChange, type = 'text', ...props }) => (
  <label className="block">
    <span className="label">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="input text-sm"
      {...props}
    />
  </label>
);

const SelectField = ({ label, value, onChange, options }) => (
  <label className="block">
    <span className="label">{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="input text-sm"
    >
      <option value="">Select {label.toLowerCase()}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  </label>
);

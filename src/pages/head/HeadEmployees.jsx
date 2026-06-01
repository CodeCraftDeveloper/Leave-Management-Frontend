import { useEffect, useMemo, useState } from 'react';
import {
  FiCheckCircle,
  FiEdit2,
  FiMail,
  FiPlus,
  FiSearch,
  FiShield,
  FiTrash2,
  FiSend,
  FiUsers,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { ListSkeleton } from '../../components/Skeleton';
import Modal from '../../components/Modal';
import {
  getTeam,
  getWeeklyDigestPreview,
  listDepartments,
  setHeadsGroup,
  sendWeeklyDigestNow,
} from '../../services/manageService';
import { createEmployee, deleteEmployee, updateEmployee } from '../../services/adminService';
import { fmtDate } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import { isSuperAdmin, SUPERADMIN_EMAILS } from '../../utils/roles';

const roleLabel = {
  employee: 'Employee',
  dept_head: 'Department Head',
  head: 'Head',
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
  role: 'employee',
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
  role: employee.role || 'employee',
});

const requiredFields = ['employeeId', 'name', 'department', 'designation'];

export default function HeadEmployees() {
  const { user } = useAuth();
  const superAdmin = isSuperAdmin(user);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [data, setData] = useState({ items: [] });
  const [departments, setDepartments] = useState([]);
  const [headDirectory, setHeadDirectory] = useState([]);
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignHeadTarget, setAssignHeadTarget] = useState(null);
  const [selectedHeadId, setSelectedHeadId] = useState('');
  const [employeeModal, setEmployeeModal] = useState(null);
  const [employeeForm, setEmployeeForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [savingAssignedHead, setSavingAssignedHead] = useState(false);
  const [removingHeadId, setRemovingHeadId] = useState('');
  const [savingEmployee, setSavingEmployee] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState(false);
  const [sendingDigest, setSendingDigest] = useState(false);

  const load = (q = search, dept = departmentFilter) => {
    setLoading(true);
    Promise.all([
      getTeam({
        search: q || undefined,
        department: dept || undefined,
        includeHeads: superAdmin ? true : undefined,
      }),
      listDepartments(),
      superAdmin ? getTeam({ includeHeads: true }).catch(() => ({ items: [] })) : Promise.resolve({ items: [] }),
      // Weekly digest is a super-admin-only global view.
      superAdmin ? getWeeklyDigestPreview().catch(() => null) : Promise.resolve(null),
    ])
      .then(([team, departmentList, headList, digestPreview]) => {
        setData(team);
        setDepartments(departmentList.items || []);
        setHeadDirectory((headList.items || []).filter((employee) => employee.role === 'head'));
        setDigest(digestPreview);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAssignHead = ({ employee, department, approvalHeads }) => {
    if (!department) {
      toast.error('Create the department group before assigning a Head');
      return;
    }
    const currentHeadIds = new Set(approvalHeads.map((head) => head._id));
    const firstAvailable = headDirectory.find((head) => !currentHeadIds.has(head._id));
    setSelectedHeadId(firstAvailable?._id || '');
    setAssignHeadTarget({ employee, department, approvalHeads });
  };

  const confirmAssignHead = async () => {
    if (!assignHeadTarget || !selectedHeadId) return;
    setSavingAssignedHead(true);
    try {
      const headIds = [
        ...assignHeadTarget.approvalHeads.map((head) => head._id),
        selectedHeadId,
      ];
      await setHeadsGroup(assignHeadTarget.department._id, [...new Set(headIds)]);
      const head = headDirectory.find((item) => item._id === selectedHeadId);
      toast.success(`${head?.name || 'Head'} assigned to ${assignHeadTarget.department.name}`);
      setAssignHeadTarget(null);
      setSelectedHeadId('');
      load(search, departmentFilter);
    } finally {
      setSavingAssignedHead(false);
    }
  };

  const removeApprovalHead = async ({ department, approvalHeads, head }) => {
    if (!department || !head) return;
    if (!confirm(`Remove ${head.name} from approval heads for ${department.name}?`)) return;
    setRemovingHeadId(`${department._id}:${head._id}`);
    try {
      const nextHeadIds = approvalHeads
        .filter((current) => current._id !== head._id)
        .map((current) => current._id);
      await setHeadsGroup(department._id, nextHeadIds);
      toast.success(`${head.name} removed from ${department.name}`);
      load(search, departmentFilter);
    } finally {
      setRemovingHeadId('');
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
      toast.error('Employee ID, name, department and designation are required');
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
        role: superAdmin ? employeeForm.role : undefined,
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

  const departmentByName = useMemo(() => {
    const map = new Map();
    for (const department of departments) map.set(department.name, department);
    return map;
  }, [departments]);

  const visibleEmployees = useMemo(
    () => data.items.filter((employee) => employee.role !== 'head'),
    [data.items]
  );

  const currentUserId = String(user?._id || '');
  const headAccounts = headDirectory.filter((head) => {
    const headId = String(head._id || '');
    const emails = [head.email, head.notificationEmail].map((value) => String(value || '').toLowerCase());
    const isSuperAdminHead = emails.some((email) => SUPERADMIN_EMAILS.includes(email));
    return !isSuperAdminHead || headId === currentUserId;
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
        subtitle={`${data.total ?? data.items.length} active employee and Head account records`}
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
            {superAdmin && (
              <button
                type="button"
                onClick={sendDigest}
                disabled={sendingDigest}
                className="btn-outline h-10 text-xs sm:text-sm gap-2"
              >
                <FiSend />
                {sendingDigest ? 'Sending...' : 'Send weekly digest'}
              </button>
            )}
          </div>
        )}
      />

      {superAdmin && (
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
      )}

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

          {superAdmin && headAccounts.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Head accounts</p>
                  <p className="text-xs text-on-surface-variant">Create, edit, or remove global and department-scoped Head login accounts.</p>
                </div>
                <span className="chip text-xs bg-surface-container-low border border-outline-variant/30">
                  {headAccounts.length} Head{headAccounts.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {headAccounts.map((head) => (
                  <article key={head._id} className="card p-4 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container border border-outline-variant/50 grid place-items-center font-semibold shrink-0">
                        {head.name?.[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm sm:text-base font-semibold truncate">{head.name}</p>
                        <p className="text-[11px] sm:text-xs text-on-surface-variant truncate">{head.employeeId} - {head.department}</p>
                        <p className="text-[11px] sm:text-xs text-on-surface-variant/75 truncate inline-flex items-center gap-1 mt-2">
                          <FiMail className="shrink-0" /> {head.email || head.notificationEmail}
                        </p>
                        <span className="chip mt-3 text-[11px] bg-primary-container text-on-primary-container border border-outline-variant/30">
                          Head
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => openEdit(head)}
                        className="btn-outline text-xs gap-1 px-2"
                      >
                        <FiEdit2 /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(head)}
                        className="btn border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs gap-1 px-2"
                      >
                        <FiTrash2 /> Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

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
                            {false && (
                              <button
                                type="button"
                                onClick={() => removeApprovalHead({ department, approvalHeads, head })}
                                disabled={removingHeadId === `${department?._id}:${head._id}`}
                                className="ml-1 w-5 h-5 rounded-full grid place-items-center hover:bg-black/10 disabled:opacity-50"
                                aria-label={`Remove ${head.name} from ${department?.name} approval heads`}
                                title="Remove approval head"
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-rose-600">No approval head assigned</p>
                    )}
                  </div>
                </div>
                {false && (
                  <div className="grid grid-cols-1 gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => openAssignHead({ employee, department, approvalHeads })}
                      disabled={!department || headDirectory.length === 0}
                      className="btn-outline text-xs"
                    >
                      <FiShield /> Assign Head
                    </button>
                  </div>
                )}
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
        </>
      )}

      <Modal
        open={!!assignHeadTarget}
        onClose={() => {
          setAssignHeadTarget(null);
          setSelectedHeadId('');
        }}
        title="Assign Approval Head"
        footer={(
          <>
            <button
              type="button"
              onClick={() => {
                setAssignHeadTarget(null);
                setSelectedHeadId('');
              }}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmAssignHead}
              disabled={savingAssignedHead || !selectedHeadId}
              className="btn-primary"
            >
              {savingAssignedHead ? 'Assigning...' : 'Assign Head'}
            </button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-outline-variant/50 p-3">
            <p className="text-xs uppercase text-on-surface-variant">Department</p>
            <p className="text-sm font-semibold">{assignHeadTarget?.department?.name}</p>
            <p className="text-xs text-on-surface-variant mt-1">
              Employee: {assignHeadTarget?.employee?.name} ({assignHeadTarget?.employee?.employeeId})
            </p>
          </div>
          <SelectField
            label="Head"
            value={selectedHeadId}
            onChange={setSelectedHeadId}
            options={headDirectory
              .filter((head) => !assignHeadTarget?.approvalHeads?.some((current) => current._id === head._id))
              .map((head) => ({
                value: head._id,
                label: headLabel(head),
              }))}
          />
          {assignHeadTarget?.approvalHeads?.length ? (
            <div>
              <p className="text-xs uppercase text-on-surface-variant">Currently assigned</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {assignHeadTarget.approvalHeads.map((head) => (
                  <span key={head._id} className="chip text-[11px] bg-primary-container text-on-primary-container border border-outline-variant/30">
                    {headLabel(head)}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
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
          {superAdmin && (
            <SelectField
              label="Account Type"
              value={employeeForm.role}
              onChange={(value) => updateForm('role', value)}
              options={[
                { value: 'employee', label: 'Employee' },
                { value: 'dept_head', label: 'Department Head (listed only)' },
                { value: 'head', label: 'Head' },
              ]}
            />
          )}
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

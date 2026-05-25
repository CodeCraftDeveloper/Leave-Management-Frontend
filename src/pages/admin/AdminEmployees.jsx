import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiMail, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { ListSkeleton } from '../../components/Skeleton';
import Modal from '../../components/Modal';
import { createEmployee, deleteEmployee, getEmployees, updateEmployee } from '../../services/adminService';
import ApplyOnBehalfModal from '../../components/ApplyOnBehalfModal';

export default function AdminEmployees() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [data, setData] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editorEmployee, setEditorEmployee] = useState(undefined);
  const [deletingId, setDeletingId] = useState(null);

  const load = (q = '') => {
    setLoading(true);
    getEmployees({ search: q || undefined, limit: 100 })
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const submit = (e) => {
    e.preventDefault();
    load(search);
  };

  const remove = async (employee) => {
    if (!confirm(`Delete ${employee.name}? Their leave history will be preserved.`)) return;
    setDeletingId(employee._id);
    try {
      await deleteEmployee(employee._id);
      toast.success('Employee deleted');
      load(search);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Employees"
        subtitle={`${data.total ?? data.items.length} total`}
        action={(
          <button
            type="button"
            onClick={() => setEditorEmployee(null)}
            className="btn bg-primary text-on-primary font-semibold px-3 py-2 text-xs sm:text-sm"
          >
            <FiPlus /> Add User
          </button>
        )}
      />

      <form onSubmit={submit} className="card p-3 relative">
        <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
          {data.items.map((e) => (
            <div
              key={e._id}
              className="card min-w-0 p-4 hover:shadow-card transition"
            >
              <button
                type="button"
                onClick={() => navigate(`/admin/employees/${e._id}`)}
                className="flex items-center gap-3 min-w-0 w-full text-left"
              >
                <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container border border-outline-variant/50 grid place-items-center font-semibold shrink-0">
                  {e.name?.[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm sm:text-base font-semibold truncate">{e.name}</p>
                  <p className="text-[11px] sm:text-xs text-on-surface-variant truncate">{e.employeeId} · {e.department}</p>
                  <p className="text-[11px] sm:text-xs text-on-surface-variant/75 truncate inline-flex items-center gap-1 mt-1">
                    <FiMail className="shrink-0" /> {e.email}
                  </p>
                </div>
              </button>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setSelectedEmployee(e)}
                  className="btn-outline flex-1 text-[11px] sm:text-xs px-2 py-1.5"
                >
                  Apply Leave
                </button>
                <button
                  type="button"
                  onClick={() => setEditorEmployee(e)}
                  aria-label={`Edit ${e.name}`}
                  className="btn-outline gap-1 text-[11px] sm:text-xs px-2 py-1.5 shrink-0"
                >
                  <FiEdit2 /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(e)}
                  disabled={deletingId === e._id}
                  aria-label={`Delete ${e.name}`}
                  className="btn border border-rose-300 text-rose-600 gap-1 text-[11px] sm:text-xs px-2 py-1.5 shrink-0 hover:bg-rose-50"
                >
                  <FiTrash2 /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ApplyOnBehalfModal
        open={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        employee={selectedEmployee}
        onSuccess={() => load(search)}
      />

      <EmployeeEditorModal
        employee={editorEmployee}
        onClose={() => setEditorEmployee(undefined)}
        onSaved={() => {
          setEditorEmployee(undefined);
          load(search);
        }}
      />
    </div>
  );
}

const emptyEmployee = {
  employeeId: '',
  name: '',
  email: '',
  password: '',
  phone: '',
  department: '',
  designation: '',
  joiningDate: '',
};

function EmployeeEditorModal({ employee, onClose, onSaved }) {
  const open = employee !== undefined;
  const isEditing = !!employee;
  const [form, setForm] = useState(emptyEmployee);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(isEditing ? {
      employeeId: employee.employeeId || '',
      name: employee.name || '',
      email: employee.email || '',
      password: '',
      phone: employee.phone || '',
      department: employee.department || '',
      designation: employee.designation || '',
      joiningDate: employee.joiningDate?.slice(0, 10) || '',
    } : emptyEmployee);
  }, [employee, isEditing, open]);

  const change = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (isEditing) {
        const employeeDetails = { ...form };
        delete employeeDetails.password;
        await updateEmployee(employee._id, employeeDetails);
        toast.success('Employee updated');
      } else {
        await createEmployee(form);
        toast.success('Employee added');
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Edit Employee' : 'Add User'}>
      <form onSubmit={save} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Employee ID *" name="employeeId" value={form.employeeId} onChange={change} required />
          <Field label="Name *" name="name" value={form.name} onChange={change} required />
        </div>
        <Field label="Email" name="email" type="email" value={form.email} onChange={change} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Phone" name="phone" value={form.phone} onChange={change} />
          {!isEditing ? (
            <Field
              label="Initial Password *"
              name="password"
              type="password"
              value={form.password}
              onChange={change}
              required
              minLength={6}
              placeholder="Minimum 6 characters"
            />
          ) : null}
        </div>
        {isEditing ? (
          <p className="text-xs text-on-surface-variant">
            Only the employee can change their password from Profile.
          </p>
        ) : null}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Department *" name="department" value={form.department} onChange={change} required />
          <Field label="Designation *" name="designation" value={form.designation} onChange={change} required />
        </div>
        <Field label="Joining Date" name="joiningDate" type="date" value={form.joiningDate} onChange={change} />
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-outline text-sm">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary text-sm px-5">
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add User'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, name, type = 'text', value, onChange, ...props }) {
  return (
    <label className="block">
      <span className="label text-xs">{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="input text-sm"
        {...props}
      />
    </label>
  );
}

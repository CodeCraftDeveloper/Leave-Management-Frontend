import { useEffect, useState } from 'react';
import {
  FiArchive,
  FiEdit2,
  FiPlus,
  FiSearch,
  FiShield,
  FiUserPlus,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { ListSkeleton } from '../../components/Skeleton';
import Modal from '../../components/Modal';
import {
  listDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  addDepartmentMember,
  removeDepartmentMember,
  setHeadsGroup,
  createEmployee,
  getTeam,
} from '../../services/manageService';

const emptyForm = { name: '', code: '', description: '' };

const toForm = (department) => ({
  name: department.name || '',
  code: department.code || '',
  description: department.description || '',
});

const splitHeads = (department) => {
  const heads = department.heads || [];
  return {
    overallHeads: heads.filter((h) => h.role === 'head'),
  };
};

export default function HeadDepartments() {
  const [search, setSearch] = useState('');
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiving, setArchiving] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [managing, setManaging] = useState(null);

  const load = () => {
    setLoading(true);
    listDepartments({ includeInactive: showInactive ? 'true' : undefined })
      .then((res) => setDepartments(res.items || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactive]);

  const openCreate = () => {
    setEditing({ _id: null });
    setForm(emptyForm);
  };

  const openEdit = (department) => {
    setEditing(department);
    setForm(toForm(department));
  };

  const closeModal = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error('Department name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description.trim(),
      };
      if (editing?._id) {
        await updateDepartment(editing._id, payload);
        toast.success('Department updated');
      } else {
        await createDepartment(payload);
        toast.success('Department created');
      }
      closeModal();
      load();
    } catch {
      // API interceptor surfaces the error.
    } finally {
      setSaving(false);
    }
  };

  const confirmArchive = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      await deleteDepartment(archiveTarget._id);
      toast.success('Department archived');
      setArchiveTarget(null);
      load();
    } catch {
      // interceptor shows the reason (e.g. still has members)
    } finally {
      setArchiving(false);
    }
  };

  const filtered = departments.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.name?.toLowerCase().includes(q)
      || d.code?.toLowerCase().includes(q)
      || d.heads?.some((h) => h.name?.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Departments"
        subtitle="Create departments, manage members, and assign Heads"
        action={(
          <button type="button" onClick={openCreate} className="btn-primary gap-2 text-sm">
            <FiPlus /> New department
          </button>
        )}
      />

      <div className="card p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, code or head"
            className="input pl-10 text-sm"
          />
        </div>
        <label className="inline-flex items-center gap-2 text-xs text-on-surface-variant">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Show archived
        </label>
      </div>

      {loading ? (
        <ListSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No departments" subtitle="Create one to assign Heads" />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((department) => {
            const { overallHeads } = splitHeads(department);
            return (
              <article key={department._id} className={`card p-4 min-w-0 ${department.active ? '' : 'opacity-60'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold truncate">{department.name}</p>
                      {department.code && (
                        <span className="chip text-[10px] bg-surface-container-low border border-outline-variant/30">
                          {department.code}
                        </span>
                      )}
                      {!department.active && (
                        <span className="chip text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                          Archived
                        </span>
                      )}
                    </div>
                    {department.description && (
                      <p className="text-xs text-on-surface-variant/75 mt-1 truncate">
                        {department.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(department)}
                      className="p-2 rounded-lg hover:bg-surface-container-low text-primary"
                      title="Edit name/code"
                    >
                      <FiEdit2 />
                    </button>
                    {department.active && (
                      <button
                        type="button"
                        onClick={() => setArchiveTarget(department)}
                        className="p-2 rounded-lg hover:bg-rose-50 text-rose-500"
                        title="Archive"
                      >
                        <FiArchive />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 text-xs text-on-surface-variant">
                  <FiUsers />
                  <span>{department.memberCount} member{department.memberCount === 1 ? '' : 's'}</span>
                </div>

                <div className="mt-3 space-y-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-on-surface-variant/75 mb-1">
                      Heads (overall)
                    </p>
                    {overallHeads.length ? (
                      <div className="flex flex-wrap gap-1">
                        {overallHeads.map((head) => (
                          <span key={head._id} className="chip text-[11px] bg-surface-container-low border border-outline-variant/30">
                            <FiShield className="inline text-primary mr-1" />
                            {head.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-on-surface-variant/60">None</p>
                    )}
                  </div>
                </div>

                {department.active && (
                  <button
                    type="button"
                    onClick={() => setManaging(department)}
                    className="btn-outline w-full mt-4 gap-2 text-sm"
                  >
                    <FiUsers /> Manage members &amp; heads
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={closeModal}
        title={editing?._id ? 'Edit department' : 'New department'}
        footer={(
          <>
            <button onClick={closeModal} className="btn-outline">Cancel</button>
            <button onClick={submit} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </>
        )}
      >
        <div className="space-y-3">
          <label className="block">
            <span className="label">Name</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder="e.g. Digital Marketing"
            />
          </label>
          <label className="block">
            <span className="label">Code (optional)</span>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="input uppercase"
              placeholder="DM"
              maxLength={12}
            />
          </label>
          <label className="block">
            <span className="label">Description (optional)</span>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input"
            />
          </label>
          <p className="text-xs text-on-surface-variant">
            After saving, use <b>Manage members &amp; heads</b> to add employees and assign Heads.
          </p>
        </div>
      </Modal>

      <Modal
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        title="Archive department"
        footer={(
          <>
            <button onClick={() => setArchiveTarget(null)} className="btn-outline">Cancel</button>
            <button onClick={confirmArchive} disabled={archiving} className="btn bg-rose-500 text-white">
              {archiving ? 'Archiving...' : 'Archive'}
            </button>
          </>
        )}
      >
        <p className="text-sm">
          Archive <b>{archiveTarget?.name}</b>? Any assigned heads will be demoted back to employees.
          Departments with active members cannot be archived — reassign them first.
        </p>
      </Modal>

      {managing && (
        <ManageDepartmentModal
          department={managing}
          onClose={() => setManaging(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

function ManageDepartmentModal({ department, onClose, onChanged }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [headPool, setHeadPool] = useState([]);

  const refresh = () => {
    setLoading(true);
    Promise.all([getDepartment(department._id), getTeam({})])
      .then(([detailRes, teamRes]) => {
        setDetail(detailRes);
        setHeadPool(teamRes.items || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department._id]);

  const run = async (fn, successMsg) => {
    setBusy(true);
    try {
      await fn();
      if (successMsg) toast.success(successMsg);
      refresh();
      onChanged();
    } catch {
      // interceptor surfaces the error
    } finally {
      setBusy(false);
    }
  };

  const members = detail?.members || [];
  const available = detail?.availableEmployees || [];
  const headGroup = detail?.headGroup || [];
  const headGroupIds = headGroup.map((h) => h._id);

  return (
    <Modal open onClose={onClose} title={`Manage · ${department.name}`}>
      {loading ? (
        <ListSkeleton count={4} />
      ) : (
        <div className="space-y-6">
          {/* Overall heads group */}
          <section>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FiShield className="text-primary" /> Heads (overall)
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5 mb-2">
              The reporting group that oversees this department. Added people get Head access; removing
              revokes it unless they head another department.
            </p>
            {headGroup.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {headGroup.map((head) => (
                  <span key={head._id} className="chip text-[11px] bg-primary-container text-on-primary-container">
                    {head.name}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(
                        () => setHeadsGroup(department._id, headGroupIds.filter((id) => id !== head._id)),
                        `${head.name} removed from Heads`,
                      )}
                      className="ml-1"
                    >
                      <FiX className="inline" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <PeoplePicker
              placeholder="Search people to add as a Head..."
              people={headPool.filter((p) => !headGroupIds.includes(p._id))}
              disabled={busy}
              onPick={(emp) => run(
                () => setHeadsGroup(department._id, [...headGroupIds, emp._id]),
                `${emp.name} added to Heads`,
              )}
            />
          </section>

          {/* Members */}
          <section>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FiUsers /> Members ({members.length})
            </h3>
            {members.length === 0 ? (
              <p className="text-xs text-on-surface-variant mt-2">No members yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-outline-variant/30 border border-outline-variant/40 rounded-xl max-h-56 overflow-y-auto">
                {members.map((emp) => (
                  <li key={emp._id} className="flex items-center gap-2 p-2">
                    <span className="text-sm truncate">{emp.name}</span>
                    <span className="text-[11px] text-on-surface-variant/60 truncate">· {emp.employeeId}</span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(
                        () => removeDepartmentMember(department._id, emp._id),
                        `${emp.name} removed from ${department.name}`,
                      )}
                      className="ml-auto text-xs text-rose-500 hover:underline shrink-0"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Add existing employee */}
          <section>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FiUserPlus /> Add an existing employee
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5 mb-2">
              Moves an employee from another department into {department.name}.
            </p>
            <PeoplePicker
              placeholder="Search employees to add..."
              people={available}
              disabled={busy}
              showDepartment
              onPick={(emp) => run(
                () => addDepartmentMember(department._id, emp._id),
                `${emp.name} added to ${department.name}`,
              )}
            />
          </section>

          {/* Create new employee */}
          <NewEmployeeForm
            department={department.name}
            disabled={busy}
            onCreate={(payload) => run(
              () => createEmployee({ ...payload, department: department.name }),
              `${payload.name} created`,
            )}
          />
        </div>
      )}
    </Modal>
  );
}

function PeoplePicker({ people, onPick, placeholder, disabled, showDepartment }) {
  const [query, setQuery] = useState('');
  const matches = people.filter((p) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q)
      || p.employeeId?.toLowerCase().includes(q)
      || p.department?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="border border-outline-variant/40 rounded-xl">
      <div className="p-2 border-b border-outline-variant/30">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="input text-sm"
          disabled={disabled}
        />
      </div>
      <div className="max-h-44 overflow-y-auto">
        {matches.length === 0 ? (
          <p className="p-3 text-xs text-on-surface-variant text-center">No matching people</p>
        ) : (
          <ul className="divide-y divide-outline-variant/30">
            {matches.slice(0, 60).map((emp) => (
              <li key={emp._id}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onPick(emp)}
                  className="w-full flex items-center gap-2 p-2 hover:bg-surface-container-low text-left disabled:opacity-50"
                >
                  <FiPlus className="text-primary shrink-0" />
                  <span className="text-sm truncate">{emp.name}</span>
                  <span className="text-[11px] text-on-surface-variant/60 truncate">
                    · {emp.employeeId}{showDepartment && emp.department ? ` · ${emp.department}` : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const emptyEmployee = { name: '', employeeId: '', email: '', designation: '', password: '' };

function NewEmployeeForm({ department, onCreate, disabled }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyEmployee);

  const submit = () => {
    if (!form.name.trim() || !form.employeeId.trim()) {
      toast.error('Name and employee ID are required');
      return;
    }
    onCreate({
      name: form.name.trim(),
      employeeId: form.employeeId.trim(),
      email: form.email.trim(),
      designation: form.designation.trim(),
      password: form.password.trim(),
    });
    setForm(emptyEmployee);
    setOpen(false);
  };

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-semibold flex items-center gap-2"
      >
        <FiUserPlus /> Create a new employee {open ? '−' : '+'}
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-on-surface-variant">
            Adds a brand-new person to the database and into {department}.
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input text-sm"
              placeholder="Full name *"
            />
            <input
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              className="input text-sm uppercase"
              placeholder="Employee ID * (e.g. H700)"
            />
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input text-sm"
              placeholder="Email (optional)"
            />
            <input
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
              className="input text-sm"
              placeholder="Designation (optional)"
            />
            <input
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input text-sm sm:col-span-2"
              placeholder="Temp password (default: changeme123)"
            />
          </div>
          <button type="button" onClick={submit} disabled={disabled} className="btn-primary text-sm">
            Create &amp; add to {department}
          </button>
        </div>
      )}
    </section>
  );
}

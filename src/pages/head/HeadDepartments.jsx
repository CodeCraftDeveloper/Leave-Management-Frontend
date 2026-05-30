import { useEffect, useState } from 'react';
import { FiArchive, FiEdit2, FiPlus, FiSearch, FiShield, FiUsers, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { ListSkeleton } from '../../components/Skeleton';
import Modal from '../../components/Modal';
import {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getTeam,
} from '../../services/manageService';
import { useAuth } from '../../context/AuthContext';
import { isSuperAdmin } from '../../utils/roles';

const emptyForm = { name: '', code: '', description: '', heads: [] };

const toForm = (department) => ({
  name: department.name || '',
  code: department.code || '',
  description: department.description || '',
  heads: (department.heads || []).map((head) => head._id || head),
});

export default function HeadDepartments() {
  const { user } = useAuth();
  const superAdmin = isSuperAdmin(user);
  const [search, setSearch] = useState('');
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiving, setArchiving] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      listDepartments({ includeInactive: showInactive ? 'true' : undefined }),
      getTeam({}),
    ])
      .then(([deptRes, teamRes]) => {
        setDepartments(deptRes.items || []);
        setEmployees(teamRes.items || []);
      })
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
        heads: form.heads,
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

  const toggleHead = (id) => {
    setForm((prev) => ({
      ...prev,
      heads: prev.heads.includes(id)
        ? prev.heads.filter((h) => h !== id)
        : [...prev.heads, id],
    }));
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
        subtitle={superAdmin
          ? 'Create departments and assign one or more department heads'
          : 'The department(s) you head'}
        action={superAdmin ? (
          <button type="button" onClick={openCreate} className="btn-primary gap-2 text-sm">
            <FiPlus /> New department
          </button>
        ) : null}
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
        <EmptyState title="No departments" subtitle="Create one to assign a department head" />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((department) => (
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
                {superAdmin && (
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(department)}
                      className="p-2 rounded-lg hover:bg-surface-container-low text-primary"
                      title="Edit"
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
                )}
              </div>

              <div className="flex items-center gap-2 mt-3 text-xs text-on-surface-variant">
                <FiUsers />
                <span>{department.memberCount} member{department.memberCount === 1 ? '' : 's'}</span>
              </div>

              <div className="mt-3">
                <p className="text-[11px] uppercase tracking-wide text-on-surface-variant/75 mb-1">
                  Department heads
                </p>
                {department.heads?.length ? (
                  <ul className="space-y-1">
                    {department.heads.map((head) => (
                      <li key={head._id} className="flex items-center gap-2 text-xs">
                        <FiShield className="text-amber-500 shrink-0" />
                        <span className="truncate">{head.name}</span>
                        <span className="text-on-surface-variant/60 shrink-0">· {head.employeeId}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-rose-500">No head assigned</p>
                )}
              </div>
            </article>
          ))}
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
          <div>
            <span className="label">Department heads</span>
            <p className="text-xs text-on-surface-variant mb-2">
              Any selected employee can approve leaves for this department. Assigning here promotes them to dept_head.
            </p>
            <HeadPicker
              employees={employees}
              selectedIds={form.heads}
              onToggle={toggleHead}
            />
          </div>
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
    </div>
  );
}

function HeadPicker({ employees, selectedIds, onToggle }) {
  const [query, setQuery] = useState('');
  const eligible = employees.filter((emp) => emp.role !== 'head');
  const matches = eligible.filter((emp) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(q)
      || emp.employeeId?.toLowerCase().includes(q)
      || emp.department?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="border border-outline-variant/40 rounded-xl">
      <div className="p-2 border-b border-outline-variant/30">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search employees..."
          className="input text-sm"
        />
      </div>
      <div className="max-h-56 overflow-y-auto">
        {matches.length === 0 ? (
          <p className="p-3 text-xs text-on-surface-variant text-center">No matching employees</p>
        ) : (
          <ul className="divide-y divide-outline-variant/30">
            {matches.slice(0, 80).map((emp) => {
              const checked = selectedIds.includes(emp._id);
              return (
                <li key={emp._id}>
                  <label className="flex items-center gap-2 p-2 hover:bg-surface-container-low cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(emp._id)}
                    />
                    <span className="text-sm truncate">{emp.name}</span>
                    <span className="text-[11px] text-on-surface-variant/60 truncate">
                      · {emp.employeeId} · {emp.department}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {selectedIds.length > 0 && (
        <div className="p-2 border-t border-outline-variant/30 flex flex-wrap gap-1.5">
          {selectedIds.map((id) => {
            const emp = employees.find((e) => e._id === id);
            if (!emp) return null;
            return (
              <span key={id} className="chip text-[11px] bg-primary-container text-on-primary-container">
                {emp.name}
                <button type="button" onClick={() => onToggle(id)} className="ml-1">
                  <FiX className="inline" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

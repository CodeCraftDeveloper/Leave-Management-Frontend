import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiMail } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { ListSkeleton } from '../../components/Skeleton';
import { getEmployees } from '../../services/adminService';
import ApplyOnBehalfModal from '../../components/ApplyOnBehalfModal';

export default function AdminEmployees() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [data, setData] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

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

  return (
    <div className="space-y-5">
      <PageHeader title="Employees" subtitle={`${data.total ?? data.items.length} total`} />

      <form onSubmit={submit} className="card p-3 relative">
        <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
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
              onClick={() => navigate(`/admin/employees/${e._id}`)}
              className="card p-4 flex items-center justify-between gap-3 hover:shadow-card transition cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white grid place-items-center font-semibold shrink-0">
                  {e.name?.[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{e.name}</p>
                  <p className="text-xs text-slate-500 truncate">{e.employeeId} · {e.department}</p>
                  <p className="text-xs text-slate-400 truncate inline-flex items-center gap-1 mt-1">
                    <FiMail className="shrink-0" /> {e.email}
                  </p>
                </div>
              </div>
              <button
                onClick={(ev) => {
                  ev.stopPropagation();
                  setSelectedEmployee(e);
                }}
                className="btn btn-outline text-xs px-2.5 py-1.5 shrink-0 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-400 border-slate-200 dark:border-slate-800 transition"
              >
                Apply Leave
              </button>
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
    </div>
  );
}

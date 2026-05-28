import { useEffect, useState } from 'react';
import { FiMail, FiSearch, FiShield } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { ListSkeleton } from '../../components/Skeleton';
import { getTeam } from '../../services/manageService';
import { useAuth } from '../../context/AuthContext';

const roleLabel = {
  employee: 'Employee',
  dept_head: 'Department Head',
  head: 'Head',
  hr: 'HR',
};

export default function MyTeam() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [data, setData] = useState({ items: [] });
  const [loading, setLoading] = useState(true);

  const load = (q = search) => {
    setLoading(true);
    getTeam({
      search: q || undefined,
      includeSelf: user?.role === 'dept_head' ? 'true' : undefined,
    })
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5">
      <PageHeader
        title={user?.role === 'dept_head' ? 'My Department' : 'Employees'}
        subtitle={user?.role === 'dept_head'
          ? 'People in your department, including your own profile'
          : 'Active employee directory'}
      />

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
          {data.items.map((employee) => (
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
                    <FiMail className="shrink-0" /> {employee.email || 'Email not added'}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <span className="chip text-[11px] bg-surface-container-low border border-outline-variant/30">
                      {roleLabel[employee.role] || employee.role}
                    </span>
                    <span className={`chip text-[11px] border ${employee.emailVerified ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {employee.emailVerified ? 'Email verified' : 'Email pending'}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

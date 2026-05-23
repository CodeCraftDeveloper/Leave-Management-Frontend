import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft, FiMail, FiPhone, FiBriefcase } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import LeaveCard from '../../components/LeaveCard';
import { ListSkeleton } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import { getEmployeeDetail } from '../../services/adminService';
import { fmtDate, leaveTypeLabel } from '../../utils/format';
import ApplyOnBehalfModal from '../../components/ApplyOnBehalfModal';

export default function AdminEmployeeDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    getEmployeeDetail(id).then(setData).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <ListSkeleton count={5} />;
  if (!data) return <EmptyState title="Employee not found" />;

  const { employee, leaves } = data;

  return (
    <div className="space-y-5">
      <Link to="/admin/employees" className="inline-flex items-center gap-2 text-sm text-primary-600">
        <FiArrowLeft /> Back to Employees
      </Link>

      <div className="card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 min-w-0">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white grid place-items-center text-2xl font-bold shadow-card shrink-0">
            {employee.name?.[0]}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold">{employee.name}</h2>
            <p className="text-sm text-slate-500">{employee.employeeId} · {employee.designation}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1"><FiMail /> {employee.email}</span>
              {employee.phone && <span className="inline-flex items-center gap-1"><FiPhone /> {employee.phone}</span>}
              <span className="inline-flex items-center gap-1"><FiBriefcase /> {employee.department}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Joined {fmtDate(employee.joiningDate)}</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary text-sm px-4 py-2 sm:self-center shrink-0 w-full sm:w-auto"
        >
          Apply Leave on Behalf
        </button>
      </div>

      <section>
        <h3 className="font-semibold mb-3">Leave Balance</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(employee.leaveBalance || {}).map(([k, v]) => (
            <div key={k} className="card p-4">
              <p className="text-xs text-slate-500">{leaveTypeLabel[k]}</p>
              <p className="text-2xl font-bold mt-1">{v}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-semibold mb-3">Leave History</h3>
        {leaves.length === 0 ? (
          <EmptyState title="No leave history" />
        ) : (
          <div className="space-y-3">
            {leaves.map((l) => <LeaveCard key={l._id} leave={l} />)}
          </div>
        )}
      </section>

      <ApplyOnBehalfModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employee={employee}
        onSuccess={() => {
          // reload employee detail
          getEmployeeDetail(id).then(setData);
        }}
      />
    </div>
  );
}

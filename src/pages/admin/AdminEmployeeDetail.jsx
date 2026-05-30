import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft, FiMail, FiPhone, FiBriefcase } from 'react-icons/fi';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import LeaveCard from '../../components/LeaveCard';
import { ListSkeleton } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import { getEmployeeDetail, updateEmployeeWorkDetails } from '../../services/adminService';
import { listDepartments } from '../../services/manageService';
import { fmtDate } from '../../utils/format';
import ApplyOnBehalfModal from '../../components/ApplyOnBehalfModal';

export default function AdminEmployeeDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workDetails, setWorkDetails] = useState({ department: '', designation: '' });
  const [savingWorkDetails, setSavingWorkDetails] = useState(false);

  useEffect(() => {
    Promise.all([
      getEmployeeDetail(id),
      listDepartments(),
    ])
      .then(([next, deptData]) => {
        setData(next);
        setDepartments(deptData.items || []);
        setWorkDetails({
          department: next.employee?.department || '',
          designation: next.employee?.designation || '',
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <ListSkeleton count={5} />;
  if (!data) return <EmptyState title="Employee not found" />;

  const { employee, leaves } = data;

  const saveWorkDetails = async (event) => {
    event.preventDefault();
    setSavingWorkDetails(true);
    try {
      const updated = await updateEmployeeWorkDetails(employee._id, workDetails);
      setData((current) => ({ ...current, employee: updated }));
      setWorkDetails({
        department: updated.department || '',
        designation: updated.designation || '',
      });
      toast.success('Work details updated');
    } finally {
      setSavingWorkDetails(false);
    }
  };

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
        <h3 className="font-semibold mb-3">Work Details</h3>
        <form onSubmit={saveWorkDetails} className="card p-5 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Department</label>
            <select
              value={workDetails.department}
              onChange={(event) => setWorkDetails((current) => ({ ...current, department: event.target.value }))}
              className="input"
              required
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d._id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Designation</label>
            <input
              value={workDetails.designation}
              onChange={(event) => setWorkDetails((current) => ({ ...current, designation: event.target.value }))}
              className="input"
              required
            />
          </div>
          <button disabled={savingWorkDetails} className="btn-primary sm:col-span-2">
            {savingWorkDetails ? 'Saving...' : 'Save Work Details'}
          </button>
        </form>
      </section>

      <section>
        <h3 className="font-semibold mb-3">Leave Policy</h3>
        <div className="card p-5">
          <p className="text-sm font-semibold text-primary">2 free leaves per month</p>
          <p className="text-xs text-slate-500 mt-1">
            Leave types are used for categorisation only. Extra leave days are deducted during payroll calculation.
          </p>
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

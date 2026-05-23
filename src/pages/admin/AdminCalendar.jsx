import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import MonthCalendar from '../../components/MonthCalendar';
import { getCalendarLeaves, getHolidays, createHoliday, deleteHoliday } from '../../services/leaveService';
import EmptyState from '../../components/EmptyState';
import { leaveTypeLabel, leaveTypeColors } from '../../utils/format';
import { ListSkeleton } from '../../components/Skeleton';

export default function AdminCalendar() {
  const [leaves, setLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  const [month, setMonth] = useState(new Date());
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    date: '',
    description: '',
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([
      getCalendarLeaves({ all: true }),
      getHolidays(),
    ])
      .then(([leavesData, holidaysData]) => {
        setLeaves(leavesData);
        setHolidays(holidaysData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const leaveByDate = useMemo(() => {
    const map = new Map();
    leaves.forEach((l) => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toDateString();
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(l);
      }
    });
    return map;
  }, [leaves]);

  const holidaysByDate = useMemo(() => {
    const map = new Map();
    holidays.forEach((h) => {
      const key = new Date(h.date).toDateString();
      map.set(key, h);
    });
    return map;
  }, [holidays]);

  const events = useMemo(() => {
    const holidayEvents = holidays.map((h) => ({
      id: 'h-' + h._id,
      title: h.name,
      startDate: h.date,
      endDate: h.date,
      kind: 'holiday',
    }));
    const leaveEvents = leaves.map((l) => ({
      id: 'l-' + l._id,
      title: `${l.employee?.name || 'Employee'} · ${leaveTypeLabel[l.leaveType] || 'Leave'}`,
      startDate: l.startDate,
      endDate: l.endDate,
      kind: 'leave-' + (l.status || 'approved'),
      data: l,
    }));
    return [...holidayEvents, ...leaveEvents];
  }, [holidays, leaves]);

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!form.name || !form.date) {
      toast.error('Name and Date are required');
      return;
    }
    setSubmitting(true);
    try {
      await createHoliday(form);
      toast.success('Holiday added successfully');
      setIsModalOpen(false);
      setForm({ name: '', date: '', description: '' });
      loadData();
    } catch (err) {
      // Errors handled by api.js toast
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHoliday = async (id, name) => {
    if (!confirm(`Are you sure you want to delete the holiday "${name}"?`)) return;
    try {
      await deleteHoliday(id);
      toast.success('Holiday deleted successfully');
      loadData();
    } catch (err) {
      // Errors handled by api.js toast
    }
  };

  const selectedLeaves = leaveByDate.get(date.toDateString()) || [];
  const selectedHoliday = holidaysByDate.get(date.toDateString());

  return (
    <div className="space-y-5">
      <PageHeader title="Leave Calendar" subtitle="All approved leaves and official holidays" />

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="card p-4">
            {loading ? (
              <div className="h-72 skeleton" />
            ) : (
              <MonthCalendar
                events={events}
                month={month}
                onChangeMonth={setMonth}
                onClickDay={(d) => setDate(d)}
              />
            )}
          </motion.div>

          <div className="card p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-base">
                Events on {date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </h3>
            </div>
            
            {selectedHoliday && (
              <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 p-4 rounded-2xl flex items-start gap-3.5 mb-3 text-indigo-900 dark:text-indigo-200">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900 grid place-items-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                  H
                </div>
                <div>
                  <h4 className="font-bold text-base">{selectedHoliday.name}</h4>
                  <p className="text-sm text-indigo-700/80 dark:text-indigo-300/80 mt-0.5">
                    {selectedHoliday.description || 'Official Company Holiday'}
                  </p>
                </div>
              </div>
            )}

            {loading ? (
              <ListSkeleton count={2} />
            ) : selectedLeaves.length === 0 && !selectedHoliday ? (
              <EmptyState title="No leaves or holidays on this day" />
            ) : (
              <div className="space-y-3">
                {selectedLeaves.map((l) => (
                  <div key={l._id} className="card p-4 flex justify-between items-start gap-3">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{l.employee?.name}</p>
                      <p className="text-xs text-slate-500">
                        {l.employee?.employeeId} · {l.employee?.department}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {l.isHalfDay
                          ? `Half-day (${l.halfDaySession === 'first_half' ? 'First Half' : 'Second Half'})`
                          : `${l.totalDays} day(s)`
                        }
                      </p>
                      <span className={`chip mt-2.5 ${leaveTypeColors[l.leaveType]}`}>
                        {leaveTypeLabel[l.leaveType]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4 flex flex-col max-h-[550px]">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <h3 className="font-semibold">Company Holiday List</h3>
              <button
                onClick={() => setIsModalOpen(true)}
                className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition cursor-pointer"
                title="Add Holiday"
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {loading ? (
                <ListSkeleton count={3} />
              ) : holidays.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No official holidays added yet.</p>
              ) : (
                holidays.map((h) => (
                  <div
                    key={h._id}
                    className="flex justify-between items-center py-2.5 px-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 transition"
                  >
                    <div>
                      <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{h.name}</h4>
                      <p className="text-xs text-slate-500">{h.description || 'Company Holiday'}</p>
                      <p className="text-[10px] text-indigo-500 font-medium mt-0.5">
                        {new Date(h.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteHoliday(h._id, h.name)}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition"
                      title="Delete Holiday"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Official Holiday">
        <form onSubmit={handleAddHoliday} className="space-y-4">
          <div>
            <label className="label">Holiday Name</label>
            <input
              type="text"
              placeholder="e.g., Independence Day"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Description (Optional)</label>
            <textarea
              placeholder="Provide a brief description..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input min-h-[80px]"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Holiday'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

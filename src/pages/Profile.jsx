import { forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiUser, FiPhone, FiBriefcase, FiLock, FiLogOut } from 'react-icons/fi';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword } from '../services/employeeService';
import { fmtDate } from '../utils/format';

const Input = forwardRef(({ icon: Icon, label, ...props }, ref) => (
  <div>
    <label className="label">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />}
      <input ref={ref} className="input pl-10" {...props} />
    </div>
  </div>
));

export default function Profile() {
  const { user, updateUser, logout } = useAuth();

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: { name: user?.name, phone: user?.phone, department: user?.department, designation: user?.designation },
  });
  const { register: rp, handleSubmit: hp, reset, formState: { isSubmitting: ps } } = useForm();

  const onProfile = async (data) => {
    const updated = await updateProfile(data);
    updateUser(updated);
    toast.success('Profile updated');
  };

  const onPassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed');
      reset();
    } catch {}
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <PageHeader title="Profile" subtitle="Manage your account details" />

      <div className="card p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white grid place-items-center text-2xl font-bold shadow-card">
          {user?.name?.[0]}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-lg truncate">{user?.name}</p>
          <p className="text-sm text-slate-500 truncate">{user?.email}</p>
          <p className="text-xs text-slate-400 mt-1">Joined {fmtDate(user?.joiningDate)}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onProfile)} className="card p-5 space-y-4">
        <h3 className="font-semibold">Personal Information</h3>
        <Input icon={FiUser} label="Full Name" {...register('name')} />
        <Input icon={FiPhone} label="Phone" {...register('phone')} />
        <Input icon={FiBriefcase} label="Department" {...register('department')} />
        <Input icon={FiBriefcase} label="Designation" {...register('designation')} />
        <button disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      <form onSubmit={hp(onPassword)} className="card p-5 space-y-4">
        <h3 className="font-semibold">Change Password</h3>
        <Input icon={FiLock} type="password" label="Current Password" {...rp('currentPassword', { required: true })} />
        <Input icon={FiLock} type="password" label="New Password" {...rp('newPassword', { required: true, minLength: 6 })} />
        <Input icon={FiLock} type="password" label="Confirm New Password" {...rp('confirmPassword', { required: true })} />
        <button disabled={ps} className="btn-primary w-full">
          {ps ? 'Updating…' : 'Update Password'}
        </button>
      </form>

      <button onClick={logout} className="btn-outline w-full">
        <FiLogOut /> Logout
      </button>
    </div>
  );
}

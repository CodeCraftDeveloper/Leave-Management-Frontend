import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword } from '../services/employeeService';

export default function Profile() {
  const { user, updateUser, logout } = useAuth();

  const { register: rp, handleSubmit: hp, reset, formState: { isSubmitting: ps } } = useForm();

  const onPassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password updated successfully');
      reset();
    } catch {}
  };

  return (
    <div className="max-w-3xl mx-auto pb-10 space-y-6">
      {/* Profile Header */}
      <section className="flex flex-col items-center justify-center py-4">
        <div className="w-24 h-24 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-3 shadow-sm border-4 border-surface overflow-hidden">
          {user?.avatar ? (
            <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold uppercase text-white">
              {user?.name?.[0] || 'U'}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-on-surface">{user?.name}</h1>
        <p className="text-sm font-semibold text-on-surface-variant">{user?.designation || 'Staff'}</p>
      </section>

      {/* Personal Information */}
      <section className="card overflow-hidden">
        <div className="bg-surface-container/50 px-5 py-3.5 border-b border-outline-variant/30 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">person</span>
          <h2 className="text-base font-bold text-primary">Personal Information</h2>
        </div>
        
        <div className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-primary">Full Name</label>
              <div className="w-full h-12 bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 text-base text-on-surface-variant flex items-center select-none font-medium">
                {user?.name || 'Not assigned'}
              </div>
            </div>
            
            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-primary">Phone</label>
              <div className="w-full h-12 bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 text-base text-on-surface-variant flex items-center select-none font-medium">
                {user?.phone || 'Not assigned'}
              </div>
            </div>

            {/* Department (Read-only) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-primary">Department</label>
              <div className="w-full h-12 bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 text-base text-on-surface-variant flex items-center select-none font-medium">
                {user?.department || 'Not assigned'}
              </div>
            </div>

            {/* Designation (Read-only) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-primary">Designation</label>
              <div className="w-full h-12 bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 text-base text-on-surface-variant flex items-center select-none font-medium">
                {user?.designation || 'Not assigned'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Change Password Card */}
      <section className="card overflow-hidden">
        <div className="bg-surface-container/50 px-5 py-3.5 border-b border-outline-variant/30 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">lock</span>
          <h2 className="text-base font-bold text-primary">Change Password</h2>
        </div>
        
        <form onSubmit={hp(onPassword)} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-primary" htmlFor="current-password">Current Password</label>
            <input
              type="password"
              className="w-full h-12 bg-surface-container-lowest border border-outline-variant rounded-xl px-4 text-base text-on-surface focus:outline-none focus:border-2 focus:border-primary focus:ring-0 transition"
              id="current-password"
              placeholder="Enter current password"
              {...rp('currentPassword', { required: true })}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-primary" htmlFor="new-password">New Password</label>
              <input
                type="password"
                className="w-full h-12 bg-surface-container-lowest border border-outline-variant rounded-xl px-4 text-base text-on-surface focus:outline-none focus:border-2 focus:border-primary focus:ring-0 transition"
                id="new-password"
                placeholder="Enter new password"
                {...rp('newPassword', { required: true, minLength: 6 })}
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-primary" htmlFor="confirm-password">Confirm Password</label>
              <input
                type="password"
                className="w-full h-12 bg-surface-container-lowest border border-outline-variant rounded-xl px-4 text-base text-on-surface focus:outline-none focus:border-2 focus:border-primary focus:ring-0 transition"
                id="confirm-password"
                placeholder="Confirm new password"
                {...rp('confirmPassword', { required: true })}
              />
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={ps}
              className="bg-primary text-on-primary font-semibold h-12 px-6 rounded-lg hover:bg-primary/90 transition-colors shadow-sm w-full md:w-auto flex items-center justify-center disabled:opacity-50"
            >
              {ps ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </section>

      {/* Logout Action */}
      <section className="pt-2 flex justify-center">
        <button
          onClick={logout}
          className="flex items-center gap-2 px-6 h-12 rounded-lg border-2 border-error text-error font-semibold hover:bg-error-container/50 transition-colors w-full md:w-auto justify-center active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          Logout
        </button>
      </section>
    </div>
  );
}

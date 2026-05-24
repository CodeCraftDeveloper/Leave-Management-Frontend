import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import BrandLogo from '../components/BrandLogo';

export default function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  const onSubmit = async (data) => {
    try {
      const user = await login(data.username.trim(), data.password);
      toast.success('Welcome back!');
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch {}
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex relative items-center justify-center p-12 bg-gradient-to-br from-primary via-primary-container to-tertiary text-white overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-primary-container/20 blur-3xl" />
        <div className="relative max-w-md">
          <BrandLogo size="full" subtitle="" textClassName="text-white" className="mb-6" />
          <h1 className="text-4xl font-bold leading-tight">Prem Industries Leave Portal</h1>
          <p className="mt-4 text-white/80">Apply, track and manage leaves seamlessly from your phone, tablet or desktop.</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center">
            <BrandLogo size="full" showText={false} className="justify-center mb-4" />
            <h1 className="text-sm font-semibold text-primary mb-2">Prem Industries</h1>
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="text-sm text-on-surface-variant mt-1">Sign in to continue to your portal</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
            <div>
              <label className="label">Employee ID or Email</label>
              <div className="relative">
                <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                <input
                  type="text"
                  placeholder="EMP001 or admin@example.com"
                  className="input pl-10"
                  {...register('username', { required: 'Employee ID or Email is required' })}
                />
              </div>
              {errors.username && <p className="text-xs text-rose-500 mt-1">{errors.username.message}</p>}
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                <input
                  type={show ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input pl-10 pr-10"
                  {...register('password', { required: 'Password is required' })}
                />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 p-1">
                  {show ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-rose-500 mt-1">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 text-base">
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

        </motion.div>
      </div>
    </div>
  );
}

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { FiMail, FiAlertCircle, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { setEmail as setEmailApi } from '../services/authService';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function EmailSetupModal() {
  const { user, updateUser } = useAuth();
  const open = !!user && user.needsEmailSetup;
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const { user: updated } = await setEmailApi(value);
      updateUser(updated);
      toast.success('Email saved');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Could not save email';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 24, stiffness: 260 }}
          className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-card overflow-hidden"
        >
          <div className="p-6 bg-gradient-to-br from-primary-600 to-accent-600 text-white">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur grid place-items-center mb-3">
              <FiMail className="text-2xl" />
            </div>
            <h3 className="text-xl font-bold">Add your email to continue</h3>
            <p className="text-sm text-white/80 mt-1">
              Hi {user.name?.split(' ')[0] || 'there'}, your account ({user.employeeId}) does not have
              an email on file. Add one to receive leave updates and unlock the portal.
            </p>
          </div>

          <form onSubmit={submit} className="p-6 space-y-4">
            <div>
              <label className="label">Work email</label>
              <input
                type="email"
                autoFocus
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
              {error && (
                <p className="text-xs text-rose-500 mt-2 flex items-center gap-1.5">
                  <FiAlertCircle /> {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-3 text-base"
            >
              {submitting ? 'Saving…' : 'Save email & continue'}
            </button>

            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
              <FiLock className="mt-0.5 shrink-0" />
              <p className="text-xs leading-relaxed">
                After adding your email, open Profile and change your password to keep your account secure.
              </p>
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              You must provide an email to use the portal. This dialog cannot be dismissed.
            </p>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

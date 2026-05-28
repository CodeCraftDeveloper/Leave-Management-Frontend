import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { FiMail, FiAlertCircle, FiShield, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  setEmail as setEmailApi,
  verifyEmail as verifyEmailApi,
  resendVerification as resendVerificationApi,
} from '../services/authService';

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const RESEND_COOLDOWN_SECONDS = 30;

export default function EmailSetupModal() {
  const { user, updateUser } = useAuth();
  // Modal shows when user has no email OR has email but not yet verified.
  const open = !!user && (user.needsEmailSetup || user.needsEmailVerification);
  const initialStep = user?.needsEmailVerification && !user?.needsEmailSetup ? 'verify' : 'email';
  const [step, setStep] = useState(initialStep);
  const [email, setEmail] = useState(user?.email || '');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const codeInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    // Reset transient state when the modal flips back open for a fresh user.
    if (open) {
      setStep(user?.needsEmailVerification && !user?.needsEmailSetup ? 'verify' : 'email');
      setEmail(user?.email || '');
      setCode('');
      setError('');
    }
  }, [open, user?.needsEmailSetup, user?.needsEmailVerification, user?.email]);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const id = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  useEffect(() => {
    if (step === 'verify') {
      // Autofocus the OTP field whenever we land on the verify step.
      setTimeout(() => codeInputRef.current?.focus(), 50);
    }
  }, [step]);

  if (!open) return null;

  const sendEmail = async (evt) => {
    evt?.preventDefault?.();
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const { user: updated, message } = await setEmailApi(value);
      updateUser(updated);
      toast.success(message || 'Verification code sent');
      setResendIn(RESEND_COOLDOWN_SECONDS);
      setStep('verify');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save email');
    } finally {
      setSubmitting(false);
    }
  };

  const verify = async (evt) => {
    evt?.preventDefault?.();
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your email');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const { user: updated } = await verifyEmailApi(code);
      updateUser(updated);
      toast.success('Email verified');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not verify code');
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    if (resendIn > 0 || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const { message } = await resendVerificationApi();
      toast.success(message || 'Code re-sent');
      setResendIn(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not resend code');
    } finally {
      setSubmitting(false);
    }
  };

  const useDifferentEmail = () => {
    setStep('email');
    setCode('');
    setError('');
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
              {step === 'email' ? <FiMail className="text-2xl" /> : <FiShield className="text-2xl" />}
            </div>
            <h3 className="text-xl font-bold">
              {step === 'email' ? 'Add your email to continue' : 'Verify your email'}
            </h3>
            <p className="text-sm text-white/80 mt-1">
              {step === 'email'
                ? `Hi ${user.name?.split(' ')[0] || 'there'}, add a work email so we can route your leave updates.`
                : `We sent a 6-digit code to ${user.email}. Enter it below to confirm.`}
            </p>
          </div>

          {step === 'email' ? (
            <form onSubmit={sendEmail} className="p-6 space-y-4">
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
                {submitting ? 'Sending code…' : 'Send verification code'}
              </button>

              <p className="text-[11px] text-slate-500 text-center">
                You must verify your email before you can apply for leave.
              </p>
            </form>
          ) : (
            <form onSubmit={verify} className="p-6 space-y-4">
              <div>
                <label className="label">6-digit code</label>
                <input
                  ref={codeInputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  className="input text-center tracking-[0.5em] text-xl font-semibold"
                  placeholder="••••••"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
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
                disabled={submitting || code.length !== 6}
                className="btn-primary w-full py-3 text-base"
              >
                {submitting ? 'Verifying…' : 'Verify email'}
                {!submitting && <FiCheckCircle className="ml-1" />}
              </button>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={useDifferentEmail}
                  className="text-primary-600 hover:underline"
                  disabled={submitting}
                >
                  Use a different email
                </button>
                <button
                  type="button"
                  onClick={resend}
                  disabled={resendIn > 0 || submitting}
                  className="text-primary-600 hover:underline disabled:text-slate-400 disabled:no-underline"
                >
                  {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                </button>
              </div>

              <p className="text-[11px] text-slate-500 text-center">
                Code expires in 15 minutes. After 5 wrong attempts you'll need a new code.
              </p>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

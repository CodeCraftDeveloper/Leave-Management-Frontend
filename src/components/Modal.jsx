import { AnimatePresence, motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { useEffect } from 'react';

const SIZE_CLASSES = {
  md: 'sm:max-w-md',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
};

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => (document.body.style.overflow = '');
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className={`bg-white dark:bg-slate-900 w-full ${SIZE_CLASSES[size] || SIZE_CLASSES.md} rounded-t-3xl sm:rounded-2xl shadow-card max-h-[92vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-10 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-semibold">{title}</h3>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                <FiX />
              </button>
            </div>
            <div className="p-5">{children}</div>
            {footer && (
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex gap-2 justify-end sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

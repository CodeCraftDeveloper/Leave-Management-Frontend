import { motion } from 'framer-motion';

const accents = {
  primary: 'from-primary-500 to-accent-500',
  emerald: 'from-emerald-500 to-teal-500',
  amber: 'from-amber-500 to-orange-500',
  rose: 'from-rose-500 to-pink-500',
  blue: 'from-blue-500 to-cyan-500',
};

export default function StatCard({ title, value, icon: Icon, accent = 'primary', subtitle }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="card p-4 sm:p-5 flex items-center gap-4 relative overflow-hidden"
    >
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-br ${accents[accent]} opacity-10`} />
      <div className={`shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br ${accents[accent]} text-white grid place-items-center shadow-card`}>
        {Icon && <Icon className="text-xl" />}
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-2xl font-bold mt-0.5 truncate">{value}</p>
        {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
      </div>
    </motion.div>
  );
}

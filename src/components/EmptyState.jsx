import { FiInbox } from 'react-icons/fi';

export default function EmptyState({ icon: Icon = FiInbox, title = 'Nothing here', subtitle, action }) {
  return (
    <div className="card p-8 flex flex-col items-center text-center gap-3">
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 grid place-items-center text-2xl text-slate-400">
        <Icon />
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

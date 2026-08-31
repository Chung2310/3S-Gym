import type { LucideIcon } from 'lucide-react';

export interface ProgressMetricCardProps {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  featured?: boolean;
}

export default function ProgressMetricCard({
  label,
  value,
  hint,
  icon: Icon,
  featured = false,
}: ProgressMetricCardProps) {
  const articleClass = featured
    ? 'group relative min-h-40 overflow-hidden rounded-2xl bg-primary p-5 text-white shadow-[0_14px_34px_rgba(0,59,112,0.18)] sm:p-6'
    : 'group min-h-40 rounded-2xl border border-slate-200 bg-white p-5 text-gym-dark transition duration-200 hover:-translate-y-0.5 hover:border-secondary/40 hover:shadow-[0_12px_30px_rgba(0,59,112,0.08)] motion-reduce:transform-none motion-reduce:transition-none sm:p-6';
  const iconClass = featured
    ? 'flex h-10 w-10 items-center justify-center rounded-xl bg-white/12 text-sky-200 ring-1 ring-inset ring-white/15'
    : 'flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-secondary ring-1 ring-inset ring-sky-100';

  return (
    <article className={articleClass}>
      {featured && (
        <span
          aria-hidden="true"
          className="absolute -right-12 -top-12 h-36 w-36 rounded-full border-[24px] border-white/5"
        />
      )}
      <div className="relative flex h-full flex-col justify-between gap-5">
        <div className="flex items-start justify-between gap-3">
          <p className={featured ? 'text-xs font-bold uppercase tracking-[0.14em] text-sky-100' : 'text-xs font-bold uppercase tracking-[0.14em] text-slate-500'}>
            {label}
          </p>
          <span className={iconClass} aria-hidden="true">
            <Icon size={19} strokeWidth={2} />
          </span>
        </div>
        <div>
          <p className={featured ? 'font-oswald text-4xl font-bold tabular-nums tracking-tight text-white' : 'font-oswald text-4xl font-bold tabular-nums tracking-tight text-primary'}>
            {value}
          </p>
          <p className={featured ? 'mt-2 max-w-56 text-xs leading-5 text-sky-100' : 'mt-2 max-w-56 text-xs leading-5 text-slate-500'}>
            {hint}
          </p>
        </div>
      </div>
    </article>
  );
}

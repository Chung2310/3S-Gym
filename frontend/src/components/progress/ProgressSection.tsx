import { useId, type ReactNode } from 'react';

export interface ProgressSectionProps {
  title: string;
  description?: string;
  count?: number;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function ProgressSection({
  title,
  description,
  count,
  action,
  children,
  className = '',
}: ProgressSectionProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className={`rounded-2xl border border-slate-200 bg-white p-4 font-montserrat sm:p-6 ${className}`}
    >
      <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={titleId} className="font-oswald text-xl font-bold uppercase tracking-tight text-primary sm:text-2xl">
              {title}
            </h2>
            {typeof count === 'number' && (
              <span className="rounded-md bg-slate-100 px-2 py-1 text-[0.7rem] font-bold uppercase tracking-wide text-slate-600">
                {count.toLocaleString('vi-VN')} mục
              </span>
            )}
          </div>
          {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      {children}
    </section>
  );
}

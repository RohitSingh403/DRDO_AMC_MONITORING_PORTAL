import { cx } from '../lib/format';

export const inputClass = 'w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brass';

export function Button({ variant = 'primary', className = '', type = 'button', ...props }) {
  const styles = {
    primary: 'bg-ink text-paper hover:bg-navy',
    quiet: 'border border-line bg-white text-ink hover:border-brass',
    brass: 'bg-brass text-white hover:bg-[#755731]',
  };
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-ink">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Banner({ tone = 'error', children }) {
  const styles = tone === 'ok'
    ? 'border-pine/30 bg-[#e7f5ee] text-[#146c3e]'
    : 'border-signal/30 bg-[#fdeceb] text-signal';
  return <div className={cx('rounded-md border px-4 py-3 text-sm', styles)}>{children}</div>;
}

export function Loading({ label = 'Loading the desk' }) {
  return (
    <div className="flex items-center gap-3 py-16 text-sm text-muted">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-brass border-t-transparent" />
      {label}
    </div>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-card px-6 py-12 text-center">
      <h2 className="font-serif text-2xl text-ink">{title}</h2>
      <div className="mx-auto mt-2 max-w-md text-sm text-muted">{children}</div>
    </div>
  );
}

const pills = {
  green: 'bg-[#e7f5ee] text-[#146c3e]',
  orange: 'bg-[#fff1e0] text-[#9a4e0b]',
  red: 'bg-[#fdeceb] text-[#9d1c14]',
  pending: 'bg-[#f4efe4] text-ink',
  'in-progress': 'bg-[#e8eef5] text-[#1e3a5f]',
  completed: 'bg-[#e7f5ee] text-[#146c3e]',
  operational: 'bg-[#e7f5ee] text-[#146c3e]',
  attention: 'bg-[#fff1e0] text-[#9a4e0b]',
  offline: 'bg-[#fdeceb] text-[#9d1c14]',
  open: 'bg-[#fdeceb] text-[#9d1c14]',
  resolved: 'bg-[#e7f5ee] text-[#146c3e]',
  low: 'bg-[#f4efe4] text-ink',
  medium: 'bg-[#fff1e0] text-[#9a4e0b]',
  high: 'bg-[#fdeceb] text-[#9d1c14]',
  daily: 'bg-[#f4efe4] text-ink',
  weekly: 'bg-[#e8eef5] text-[#1e3a5f]',
  monthly: 'bg-[#f3eadf] text-[#6d4c2b]',
};

export function Pill({ tone, children }) {
  return (
    <span className={cx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', pills[tone] || pills.pending)}>
      {children}
    </span>
  );
}

export function Card({ className = '', children }) {
  return <section className={cx('rounded-lg border border-line bg-card shadow-card', className)}>{children}</section>;
}

export function Kpi({ label, value, hint }) {
  return (
    <Card className="px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-2 font-serif text-4xl leading-none text-ink">{value}</p>
      <p className="mt-2 text-sm text-muted">{hint}</p>
    </Card>
  );
}

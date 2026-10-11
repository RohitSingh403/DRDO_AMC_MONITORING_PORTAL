import { Link } from 'react-router-dom';
import { cx } from '../lib/format';

export const inputClass = 'w-full border border-line bg-white px-2.5 py-1.5 text-sm text-ink outline-none transition focus:border-link';

const swatches = {
  green: 'bg-pine',
  orange: 'bg-amber',
  red: 'bg-signal',
  pending: 'bg-[#8a93a3]',
  'in-progress': 'bg-link',
  completed: 'bg-pine',
  operational: 'bg-pine',
  attention: 'bg-amber',
  offline: 'bg-signal',
  open: 'bg-signal',
  resolved: 'bg-pine',
  low: 'bg-[#8a93a3]',
  medium: 'bg-amber',
  high: 'bg-signal',
  daily: 'bg-ink',
  weekly: 'bg-link',
  monthly: 'bg-[#6b4f2a]',
};

export function Button({ variant = 'primary', className = '', type = 'button', to, ...props }) {
  const styles = {
    primary: 'bg-navy text-white hover:bg-ink',
    quiet: 'border border-line bg-white text-ink hover:border-ink',
    brass: 'bg-navy text-white hover:bg-ink',
  };
  const classNames = cx(
    'inline-flex h-8 items-center justify-center gap-2 px-3 text-[13px] font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
    styles[variant],
    className,
  );
  if (to) return <Link to={to} className={classNames} {...props} />;
  return <button type={type} className={classNames} {...props} />;
}

export function Field({ label, hint, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-[13px] text-ink">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Banner({ tone = 'error', children }) {
  const styles = tone === 'ok'
    ? 'border-pine/40 bg-[#f3faf6] text-[#14613c]'
    : 'border-signal/40 bg-[#fdf4f2] text-[#8f2d1c]';
  return <div className={cx('border px-3 py-2 text-sm', styles)}>{children}</div>;
}

export function Loading({ label = 'Loading' }) {
  return (
    <p className="flex items-center gap-2 py-10 font-mono text-[12px] text-muted">
      <span className="inline-block h-2 w-2 animate-pulse bg-ink" />
      {label}
    </p>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="border border-line bg-white px-4 py-8">
      <h2 className="text-sm font-medium">{title}</h2>
      <div className="mt-1 max-w-lg text-sm text-muted">{children}</div>
    </div>
  );
}

export function Pill({ tone, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-ink">
      <span className={cx('h-2 w-2 shrink-0', swatches[tone] || swatches.pending)} />
      {children}
    </span>
  );
}

export function Card({ className = '', children }) {
  return <section className={cx('border border-line bg-white', className)}>{children}</section>;
}

export function PageHeader({ title, lede, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold leading-none tracking-tight">{title}</h1>
        {lede ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{lede}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Segment({ value, onChange, options }) {
  return (
    <div className="inline-flex border border-line bg-white">
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cx(
            'h-8 px-3 text-[13px]',
            index > 0 && 'border-l border-line',
            value === option.value ? 'bg-navy text-white' : 'text-ink hover:bg-canvas',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function StatStrip({ items }) {
  return (
    <div className="border border-line bg-white sm:grid sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cx(
            'px-4 py-3',
            index > 0 && 'border-t border-line sm:border-t-0',
            index % 2 === 1 && 'sm:border-l sm:border-line',
            index >= 2 && 'sm:border-t xl:border-t-0',
            index > 0 && 'xl:border-l xl:border-line',
          )}
        >
          <p className="text-[12px] text-muted">{item.label}</p>
          <p className="mt-1 font-mono text-[26px] font-medium leading-none tabular-nums">{item.value}</p>
          <p className="mt-2 text-[12px] text-muted">{item.hint}</p>
        </div>
      ))}
    </div>
  );
}

export function PanelTitle({ children, action }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-2.5">
      <h2 className="text-sm font-medium">{children}</h2>
      {action}
    </div>
  );
}

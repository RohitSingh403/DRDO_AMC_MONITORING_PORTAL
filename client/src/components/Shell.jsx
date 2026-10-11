import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cx, formatDay, roleLabel } from '../lib/format';

const links = [
  { to: '/', label: 'Board', end: true },
  { to: '/tasks', label: 'Tasks' },
  { to: '/schedule', label: 'Assign', admin: true },
  { to: '/reports', label: 'Reports' },
  { to: '/incidents', label: 'Incidents' },
  { to: '/equipment', label: 'Equipment' },
];

function Mark() {
  return (
    <span className="flex h-4 items-end gap-0.5" aria-hidden="true">
      <span className="h-2.5 w-1 bg-pine" />
      <span className="h-4 w-1 bg-amber" />
      <span className="h-3 w-1 bg-signal" />
    </span>
  );
}

export default function Shell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const items = links.filter((item) => !item.admin || user?.role === 'admin');

  return (
    <div className="min-h-screen bg-canvas">
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-ink/30 md:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <aside className={cx(
        'fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col border-r border-line bg-white transition-transform md:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="flex h-14 items-center gap-3 border-b border-line px-4">
          <Mark />
          <div>
            <p className="text-sm font-semibold leading-none">AMC Desk</p>
            <p className="mt-1 font-mono text-[10px] uppercase text-muted">Maintenance</p>
          </div>
        </div>
        <nav className="flex-1 px-2 py-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => cx(
                'mb-0.5 block px-2.5 py-1.5 text-[13px]',
                isActive ? 'bg-[#e7edf4] font-medium text-ink' : 'text-muted hover:bg-canvas hover:text-ink',
              )}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-line px-4 py-3">
          <p className="truncate text-[13px] font-medium">{user?.name}</p>
          <p className="mt-0.5 text-[12px] text-muted">{roleLabel(user?.role)}</p>
          <button
            type="button"
            className="mt-2 text-[13px] text-link hover:underline"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <div className="md:pl-[220px]">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-line bg-white px-4 md:px-6">
          <button
            type="button"
            className="h-8 border border-line bg-white px-2.5 text-[13px] md:hidden"
            onClick={() => setOpen(true)}
          >
            Menu
          </button>
          <p className="hidden font-mono text-[12px] text-muted md:block">{formatDay()}</p>
          <p className="ml-auto text-[13px] text-ink">{roleLabel(user?.role)}</p>
        </header>
        <main className="px-4 py-5 md:px-6 md:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

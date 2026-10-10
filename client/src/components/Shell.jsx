import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cx, roleLabel } from '../lib/format';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/tasks', label: 'Tasks' },
  { to: '/schedule', label: 'Assign', admin: true },
  { to: '/reports', label: 'Reports' },
  { to: '/incidents', label: 'Incidents' },
  { to: '/equipment', label: 'Equipment' },
];

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
    <div className="min-h-screen">
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-ink/40 md:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <aside className={cx(
        'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-navy text-white transition-transform md:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="grid h-10 w-10 place-items-center border border-brass font-serif text-sm text-[#e7d3b1]">AD</div>
          <div>
            <p className="font-serif text-xl leading-none">AMC Desk</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/50">Monitoring portal</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => cx(
                'block rounded-md px-3 py-2 text-sm',
                isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white',
              )}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 px-5 py-4">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-white/50">{roleLabel(user?.role)}</p>
          <button
            type="button"
            className="mt-3 text-sm text-[#e7d3b1] hover:text-white"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line/80 bg-paper/90 px-4 py-3 backdrop-blur md:px-8">
          <button
            type="button"
            className="rounded-md border border-line bg-white px-3 py-1.5 text-sm md:hidden"
            onClick={() => setOpen(true)}
          >
            Menu
          </button>
          <p className="hidden text-sm text-muted md:block">Annual maintenance desk</p>
          <p className="text-sm text-ink">{roleLabel(user?.role)}</p>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

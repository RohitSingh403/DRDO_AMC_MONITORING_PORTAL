import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Banner, Button, Field, inputClass } from '../components/ui';
import { roleLabel } from '../lib/format';

const demos = [
  { label: 'IT Admin', email: 'admin@amc.local', password: 'Admin@123', detail: 'Assign, monitor, and close the desk' },
  { label: 'AMC Personnel', email: 'personnel@amc.local', password: 'Personnel@123', detail: 'Update the checks assigned to you' },
];

export default function Login() {
  const { user, ready, login } = useAuth();
  const [email, setEmail] = useState('admin@amc.local');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (ready && user) return <Navigate to="/" replace />;

  async function submit(event, nextEmail = email, nextPassword = password) {
    event?.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(nextEmail, nextPassword);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="flex flex-col justify-between bg-navy px-8 py-10 text-white lg:px-14">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center border border-brass font-serif text-sm text-[#e7d3b1]">AD</div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/60">AMC Monitoring Portal</p>
        </div>
        <div className="max-w-md py-16">
          <h1 className="font-serif text-5xl leading-tight">The maintenance desk, in one place.</h1>
          <p className="mt-6 text-base leading-relaxed text-white/70">
            Daily, weekly, and monthly checks for the server room, networks, and video-conferencing rooms.
            Assign the work, keep the proof, and watch the line move from green to orange to red.
          </p>
        </div>
        <p className="text-sm text-white/40">A personal operations build. Not an official system.</p>
      </section>
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <h2 className="font-serif text-4xl">Sign in</h2>
          <p className="mt-2 text-sm text-muted">Use a desk account. The demo passwords are filled in below.</p>
          <form className="mt-8 space-y-4" onSubmit={(event) => submit(event)}>
            {error ? <Banner>{error}</Banner> : null}
            <Field label="Email">
              <input className={inputClass} type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </Field>
            <Field label="Password">
              <input className={inputClass} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </Field>
            <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Signing in…' : 'Enter the desk'}</Button>
          </form>
          <div className="mt-8 grid gap-3">
            {demos.map((demo) => (
              <button
                key={demo.email}
                type="button"
                className="rounded-lg border border-line bg-card px-4 py-3 text-left transition hover:border-brass"
                onClick={(event) => {
                  setEmail(demo.email);
                  setPassword(demo.password);
                  submit(event, demo.email, demo.password);
                }}
              >
                <span className="block text-sm font-medium">{demo.label}</span>
                <span className="mt-1 block text-xs text-muted">{demo.email} · {roleLabel(demo.label === 'IT Admin' ? 'admin' : 'personnel')}</span>
                <span className="mt-1 block text-xs text-muted">{demo.detail}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Banner, Button, Field, inputClass } from '../components/ui';

const demos = [
  { label: 'IT Admin', email: 'admin@amc.local', password: 'Admin@123', detail: 'Assigns checks and closes incidents' },
  { label: 'AMC Personnel', email: 'personnel@amc.local', password: 'Personnel@123', detail: 'Updates status, remarks, and proof' },
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
    <div className="grid min-h-screen place-items-center bg-canvas px-4 py-10">
      <div className="w-full max-w-[420px] border border-line bg-white">
        <div className="flex h-1" aria-hidden="true">
          <span className="flex-1 bg-pine" />
          <span className="flex-1 bg-amber" />
          <span className="flex-1 bg-signal" />
        </div>
        <div className="px-5 py-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">AMC Desk</p>
            <p className="font-mono text-[11px] text-muted">MONITORING</p>
          </div>
          <h1 className="mt-6 text-xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm leading-6 text-muted">
            Daily, weekly, and monthly checks. Admins assign the work. Personnel record status, remarks, and proof.
          </p>
          <form className="mt-5 space-y-3" onSubmit={(event) => submit(event)}>
            {error ? <Banner>{error}</Banner> : null}
            <Field label="Email">
              <input className={inputClass} type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </Field>
            <Field label="Password">
              <input className={inputClass} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </Field>
            <Button type="submit" className="mt-1 w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
          </form>
          <div className="mt-5 border-t border-line pt-4">
            <p className="text-[12px] text-muted">Use a demo account</p>
            <div className="mt-2 border border-line">
              {demos.map((demo, index) => (
                <button
                  key={demo.email}
                  type="button"
                  className={`flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left hover:bg-canvas ${index > 0 ? 'border-t border-line' : ''}`}
                  onClick={(event) => {
                    setEmail(demo.email);
                    setPassword(demo.password);
                    submit(event, demo.email, demo.password);
                  }}
                >
                  <span>
                    <span className="block text-[13px] font-medium">{demo.label}</span>
                    <span className="mt-0.5 block text-[12px] text-muted">{demo.detail}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-muted">{demo.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

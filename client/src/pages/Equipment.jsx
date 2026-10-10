import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Banner, Button, Card, Empty, Field, Loading, Pill, inputClass } from '../components/ui';
import { statusLabel } from '../lib/format';

export default function Equipment() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '', category: 'Server', location: 'Server room', serial: '', status: 'operational', notes: '',
  });

  function load() {
    return api.get('/api/equipment').then((data) => setItems(data.equipment));
  }

  useEffect(() => {
    load().catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  async function create(event) {
    event.preventDefault();
    setError('');
    try {
      await api.post('/api/equipment', form);
      setForm({ ...form, name: '', serial: '', notes: '' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <Loading label="Loading equipment" />;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-brass">Maintenance</p>
        <h1 className="mt-2 font-serif text-4xl">Equipment</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">Service history for the server room, VC room, and endpoints.</p>
      </header>
      {error ? <Banner>{error}</Banner> : null}
      {items.length === 0 ? <Empty title="No equipment yet">Add the first asset from the form below.</Empty> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Link key={item._id} to={`/equipment/${item._id}`} className="rounded-lg border border-line bg-card p-5 shadow-card transition hover:border-brass">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl">{item.name}</h2>
                <p className="mt-1 text-sm text-muted">{item.location}</p>
              </div>
              <Pill tone={item.status}>{statusLabel(item.status)}</Pill>
            </div>
            <p className="mt-4 text-xs uppercase tracking-[0.14em] text-muted">{item.category} · {item.serial}</p>
            <p className="mt-2 text-sm text-muted">{item.serviceHistory?.length || 0} service records</p>
          </Link>
        ))}
      </div>
      {user?.role === 'admin' ? (
        <form className="grid gap-4 md:grid-cols-2" onSubmit={create}>
          <Card className="space-y-4 p-5 md:col-span-2">
            <h2 className="font-serif text-2xl">Add equipment</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name"><input className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></Field>
              <Field label="Serial"><input className={inputClass} value={form.serial} onChange={(event) => setForm({ ...form, serial: event.target.value })} required /></Field>
              <Field label="Category"><input className={inputClass} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required /></Field>
              <Field label="Location"><input className={inputClass} value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} required /></Field>
            </div>
            <Button type="submit">Save equipment</Button>
          </Card>
        </form>
      ) : null}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Banner, Button, Card, Empty, Field, Loading, PageHeader, PanelTitle, Pill, inputClass } from '../components/ui';
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
    <div className="space-y-4">
      <PageHeader
        title="Equipment"
        lede="Assets in the server room, VC rooms, and endpoints, with the service history attached to each one."
      />
      {error ? <Banner>{error}</Banner> : null}
      {items.length === 0 ? <Empty title="No equipment yet">Add the first asset from the form below.</Empty> : (
        <Card>
          <div className="hidden grid-cols-12 gap-3 border-b border-line bg-[#f7f8fa] px-4 py-2 text-[12px] text-muted md:grid">
            <div className="col-span-4">Asset</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Location</div>
            <div className="col-span-2">Serial</div>
            <div className="col-span-2">Status</div>
          </div>
          <ul>
            {items.map((item) => (
              <li key={item._id} className="border-b border-line last:border-b-0">
                <Link to={`/equipment/${item._id}`} className="grid gap-1 px-4 py-2.5 hover:bg-canvas md:grid-cols-12 md:items-center">
                  <span className="md:col-span-4">
                    <span className="block text-sm">{item.name}</span>
                    <span className="text-[12px] text-muted md:hidden">{item.location}</span>
                  </span>
                  <span className="text-sm text-muted md:col-span-2">{item.category}</span>
                  <span className="hidden text-sm md:col-span-2 md:block">{item.location}</span>
                  <span className="font-mono text-[12px] text-muted md:col-span-2">{item.serial}</span>
                  <span className="md:col-span-2">
                    <Pill tone={item.status}>{statusLabel(item.status)}</Pill>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {user?.role === 'admin' ? (
        <form onSubmit={create}>
          <Card>
            <PanelTitle>Add equipment</PanelTitle>
            <div className="space-y-3 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Name"><input className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></Field>
                <Field label="Serial"><input className={inputClass} value={form.serial} onChange={(event) => setForm({ ...form, serial: event.target.value })} required /></Field>
                <Field label="Category"><input className={inputClass} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required /></Field>
                <Field label="Location"><input className={inputClass} value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} required /></Field>
              </div>
              <Button type="submit">Save equipment</Button>
            </div>
          </Card>
        </form>
      ) : null}
    </div>
  );
}

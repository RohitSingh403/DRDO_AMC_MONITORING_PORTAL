import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Banner, Button, Card, Field, Loading, Pill, inputClass } from '../components/ui';
import { formatDateInput, formatWhen, statusLabel } from '../lib/format';

export default function EquipmentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState({
    serviceType: '',
    notes: '',
    date: formatDateInput(new Date()),
  });

  function load() {
    return api.get(`/api/equipment/${id}`).then((data) => setItem(data.equipment));
  }

  useEffect(() => {
    load().catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [id]);

  async function changeStatus(status) {
    setError('');
    try {
      await api.patch(`/api/equipment/${id}`, { status });
      await load();
      setNotice('Status updated.');
    } catch (err) {
      setError(err.message);
    }
  }

  async function addService(event) {
    event.preventDefault();
    setError('');
    try {
      const data = await api.post(`/api/equipment/${id}/history`, service);
      setItem(data.equipment);
      setService({ serviceType: '', notes: '', date: formatDateInput(new Date()) });
      setNotice('Service recorded.');
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <Loading label="Opening equipment" />;
  if (!item) return <Banner>{error || 'Equipment not found'}</Banner>;

  const history = [...(item.serviceHistory || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="space-y-6">
      <Link to="/equipment" className="text-sm text-brass">Back to equipment</Link>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-brass">{item.category} · {item.serial}</p>
          <h1 className="mt-2 font-serif text-4xl">{item.name}</h1>
          <p className="mt-2 text-sm text-muted">{item.location}</p>
          {item.notes ? <p className="mt-3 max-w-2xl text-sm">{item.notes}</p> : null}
        </div>
        <Pill tone={item.status}>{statusLabel(item.status)}</Pill>
      </header>
      {error ? <Banner>{error}</Banner> : null}
      {notice ? <Banner tone="ok">{notice}</Banner> : null}

      {user?.role === 'admin' ? (
        <Card className="flex flex-wrap items-center gap-3 p-5">
          <span className="text-sm">Desk status</span>
          {['operational', 'attention', 'offline'].map((status) => (
            <Button key={status} variant={item.status === status ? 'primary' : 'quiet'} onClick={() => changeStatus(status)}>
              {statusLabel(status)}
            </Button>
          ))}
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <h2 className="font-serif text-2xl">Service history</h2>
          {history.length === 0 ? <p className="mt-4 text-sm text-muted">No service has been recorded.</p> : null}
          <ol className="mt-4 space-y-4">
            {history.map((entry) => (
              <li key={entry._id} className="border-l-2 border-brass pl-4">
                <p className="text-sm font-medium">{entry.serviceType}</p>
                <p className="mt-1 text-sm text-muted">{entry.notes}</p>
                <p className="mt-1 text-xs text-muted">
                  {formatWhen(entry.date)} · {entry.technician?.name || 'Desk'}
                  {entry.task?.title ? ` · ${entry.task.title}` : ''}
                </p>
              </li>
            ))}
          </ol>
        </Card>
        {user?.role === 'admin' ? (
          <form className="lg:col-span-2" onSubmit={addService}>
            <Card className="space-y-4 p-5">
              <h2 className="font-serif text-2xl">Record service</h2>
              <Field label="Type">
                <input className={inputClass} value={service.serviceType} onChange={(event) => setService({ ...service, serviceType: event.target.value })} required />
              </Field>
              <Field label="Date">
                <input className={inputClass} type="date" value={service.date} onChange={(event) => setService({ ...service, date: event.target.value })} required />
              </Field>
              <Field label="Notes">
                <textarea className={`${inputClass} min-h-24`} value={service.notes} onChange={(event) => setService({ ...service, notes: event.target.value })} />
              </Field>
              <Button type="submit">Add to history</Button>
            </Card>
          </form>
        ) : null}
      </div>
    </div>
  );
}

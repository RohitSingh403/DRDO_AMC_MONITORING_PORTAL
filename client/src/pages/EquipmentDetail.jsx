import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Banner, Button, Card, Field, Loading, PageHeader, PanelTitle, Pill, inputClass } from '../components/ui';
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
    <div className="space-y-4">
      <p className="text-[13px] text-muted">
        <Link to="/equipment" className="text-link">Equipment</Link>
        <span className="px-1.5">/</span>
        {item.category}
      </p>
      <PageHeader
        title={item.name}
        lede={[item.location, item.serial, item.notes].filter(Boolean).join(' · ')}
        actions={<Pill tone={item.status}>{statusLabel(item.status)}</Pill>}
      />
      {error ? <Banner>{error}</Banner> : null}
      {notice ? <Banner tone="ok">{notice}</Banner> : null}

      {user?.role === 'admin' ? (
        <Card className="flex flex-wrap items-center gap-2 px-4 py-3">
          <span className="mr-2 text-[13px] text-muted">Desk status</span>
          {['operational', 'attention', 'offline'].map((status) => (
            <Button key={status} variant={item.status === status ? 'primary' : 'quiet'} onClick={() => changeStatus(status)}>
              {statusLabel(status)}
            </Button>
          ))}
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <PanelTitle>Service history</PanelTitle>
          {history.length === 0 ? <p className="px-4 py-4 text-sm text-muted">No service has been recorded.</p> : null}
          <ol>
            {history.map((entry) => (
              <li key={entry._id} className="border-t border-line px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-medium">{entry.serviceType}</p>
                  <p className="font-mono text-[11px] text-muted">{formatWhen(entry.date)}</p>
                </div>
                {entry.notes ? <p className="mt-1 text-sm text-muted">{entry.notes}</p> : null}
                <p className="mt-1 text-[12px] text-muted">
                  {entry.technician?.name || 'Desk'}
                  {entry.task?.title ? ` · ${entry.task.title}` : ''}
                </p>
              </li>
            ))}
          </ol>
        </Card>
        {user?.role === 'admin' ? (
          <form className="lg:col-span-2" onSubmit={addService}>
            <Card>
              <PanelTitle>Record service</PanelTitle>
              <div className="space-y-3 p-4">
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
              </div>
            </Card>
          </form>
        ) : null}
      </div>
    </div>
  );
}

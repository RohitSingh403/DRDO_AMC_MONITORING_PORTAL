import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Banner, Button, Card, Empty, Field, Loading, Pill, inputClass } from '../components/ui';
import { formatWhen, statusLabel } from '../lib/format';

export default function Incidents() {
  const { user } = useAuth();
  const [status, setStatus] = useState('');
  const [incidents, setIncidents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [taskId, setTaskId] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  function load(nextStatus = status) {
    const params = new URLSearchParams();
    if (nextStatus) params.set('status', nextStatus);
    return Promise.all([
      api.get(`/api/incidents?${params.toString()}`),
      api.get('/api/tasks'),
    ]).then(([log, board]) => {
      setIncidents(log.incidents);
      setTasks(board.tasks);
      setTaskId((current) => current || board.tasks[0]?._id || '');
    });
  }

  useEffect(() => {
    let cancel = false;
    load(status)
      .catch((err) => {
        if (!cancel) setError(err.message);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [status]);

  async function create(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    try {
      await api.post('/api/incidents', { taskId, message, severity });
      setMessage('');
      setNotice('Incident logged.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function resolve(id) {
    setError('');
    try {
      await api.patch(`/api/incidents/${id}`, { status: 'resolved' });
      setNotice('Incident resolved.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-brass">Support log</p>
        <h1 className="mt-2 font-serif text-4xl">Incidents</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          An open incident turns its task red, even when the due time has not passed.
        </p>
      </header>
      <div className="flex gap-2">
        {['', 'open', 'resolved'].map((item) => (
          <button
            key={item || 'all'}
            type="button"
            onClick={() => setStatus(item)}
            className={`rounded-full px-4 py-1.5 text-sm ${status === item ? 'bg-ink text-paper' : 'border border-line bg-white'}`}
          >
            {item === '' ? 'All' : statusLabel(item)}
          </button>
        ))}
      </div>
      {error ? <Banner>{error}</Banner> : null}
      {notice ? <Banner tone="ok">{notice}</Banner> : null}
      {loading ? <Loading label="Loading incidents" /> : null}
      {!loading && incidents.length === 0 ? <Empty title="The log is clear">No incidents match this filter.</Empty> : null}
      {!loading && incidents.length > 0 ? (
        <Card>
          <ul>
            {incidents.map((incident) => (
              <li key={incident._id} className="border-b border-line px-4 py-4 last:border-b-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm">{incident.message}</p>
                    <p className="mt-1 text-xs text-muted">
                      <Link className="text-brass" to={`/tasks/${incident.task?._id}`}>{incident.task?.title}</Link>
                      {' · '}{incident.reportedBy?.name} · {formatWhen(incident.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill tone={incident.severity}>{incident.severity}</Pill>
                    <Pill tone={incident.status}>{statusLabel(incident.status)}</Pill>
                    {user?.role === 'admin' && incident.status === 'open' ? (
                      <Button variant="quiet" onClick={() => resolve(incident._id)}>Resolve</Button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <form className="grid gap-4 md:grid-cols-2" onSubmit={create}>
        <Card className="space-y-4 p-5 md:col-span-2">
          <h2 className="font-serif text-2xl">Log an incident</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Task">
              <select className={inputClass} value={taskId} onChange={(event) => setTaskId(event.target.value)} required>
                {tasks.map((task) => <option key={task._id} value={task._id}>{task.title}</option>)}
              </select>
            </Field>
            <Field label="Severity">
              <select className={inputClass} value={severity} onChange={(event) => setSeverity(event.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </Field>
          </div>
          <Field label="What happened">
            <textarea className={`${inputClass} min-h-24`} value={message} onChange={(event) => setMessage(event.target.value)} required />
          </Field>
          <Button type="submit">Add to the log</Button>
        </Card>
      </form>
    </div>
  );
}

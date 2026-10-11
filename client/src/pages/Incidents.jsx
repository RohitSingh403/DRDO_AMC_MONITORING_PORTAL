import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Banner, Button, Card, Empty, Field, Loading, PageHeader, PanelTitle, Pill, Segment, inputClass } from '../components/ui';
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
    <div className="space-y-4">
      <PageHeader
        title="Incidents"
        lede="An open incident keeps its task red, even when the due time has not passed."
      />
      <Segment
        value={status}
        onChange={setStatus}
        options={[
          { value: '', label: 'All' },
          { value: 'open', label: 'Open' },
          { value: 'resolved', label: 'Resolved' },
        ]}
      />
      {error ? <Banner>{error}</Banner> : null}
      {notice ? <Banner tone="ok">{notice}</Banner> : null}
      {loading ? <Loading label="Loading incidents" /> : null}
      {!loading && incidents.length === 0 ? <Empty title="The log is clear">No incidents match this filter.</Empty> : null}
      {!loading && incidents.length > 0 ? (
        <Card>
          <div className="hidden grid-cols-12 gap-3 border-b border-line bg-[#f7f8fa] px-4 py-2 text-[12px] text-muted md:grid">
            <div className="col-span-5">What happened</div>
            <div className="col-span-3">Task</div>
            <div className="col-span-2">Severity</div>
            <div className="col-span-2">Status</div>
          </div>
          <ul>
            {incidents.map((incident) => (
              <li key={incident._id} className="grid gap-2 border-b border-line px-4 py-3 last:border-b-0 md:grid-cols-12 md:items-center">
                <div className="md:col-span-5">
                  <p className="text-sm">{incident.message}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted">{incident.reportedBy?.name} · {formatWhen(incident.createdAt)}</p>
                </div>
                <p className="text-sm md:col-span-3">
                  <Link className="text-link" to={`/tasks/${incident.task?._id}`}>{incident.task?.title}</Link>
                </p>
                <p className="md:col-span-2">
                  <Pill tone={incident.severity}>{incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}</Pill>
                </p>
                <div className="flex items-center gap-3 md:col-span-2">
                  <Pill tone={incident.status}>{statusLabel(incident.status)}</Pill>
                  {user?.role === 'admin' && incident.status === 'open' ? (
                    <Button variant="quiet" onClick={() => resolve(incident._id)}>Resolve</Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <form onSubmit={create}>
        <Card>
          <PanelTitle>Log an incident</PanelTitle>
          <div className="space-y-3 p-4">
            <div className="grid gap-3 md:grid-cols-2">
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
          </div>
        </Card>
      </form>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Banner, Card, Empty, Loading, Pill, inputClass } from '../components/ui';
import { alertLabel, formatWhen, frequencyLabel, statusLabel } from '../lib/format';

const frequencies = ['daily', 'weekly', 'monthly'];

export default function Tasks() {
  const { user } = useAuth();
  const [frequency, setFrequency] = useState('daily');
  const [status, setStatus] = useState('');
  const [alert, setAlert] = useState('');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setQuery(q.trim()), 250);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    const params = new URLSearchParams({ frequency });
    if (status) params.set('status', status);
    if (alert) params.set('alert', alert);
    if (query) params.set('q', query);
    let cancel = false;
    setLoading(true);
    api.get(`/api/tasks?${params.toString()}`)
      .then((data) => {
        if (cancel) return;
        const alertRank = { red: 0, orange: 1, green: 2 };
        const statusRank = { pending: 0, 'in-progress': 0, completed: 1 };
        const ordered = [...data.tasks].sort((a, b) => {
          const byStatus = statusRank[a.status] - statusRank[b.status];
          if (byStatus) return byStatus;
          const byAlert = alertRank[a.alert] - alertRank[b.alert];
          if (byAlert) return byAlert;
          return new Date(a.dueAt) - new Date(b.dueAt);
        });
        setTasks(ordered);
      })
      .catch((err) => {
        if (!cancel) setError(err.message);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [frequency, status, alert, query]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-brass">Board</p>
          <h1 className="mt-2 font-serif text-4xl">Tasks</h1>
          <p className="mt-2 text-sm text-muted">
            {user?.role === 'admin' ? 'Every check on the desk.' : 'Checks assigned to you.'}
          </p>
        </div>
        {user?.role === 'admin' ? <Link to="/schedule" className="rounded-md bg-ink px-4 py-2 text-sm text-paper">Assign work</Link> : null}
      </header>

      <div className="flex flex-wrap gap-2">
        {frequencies.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFrequency(item)}
            className={`rounded-full px-4 py-1.5 text-sm ${frequency === item ? 'bg-ink text-paper' : 'border border-line bg-white text-ink'}`}
          >
            {frequencyLabel(item)}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <input className={inputClass} placeholder="Search checks" value={q} onChange={(event) => setQ(event.target.value)} />
        <select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Any status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
        <select className={inputClass} value={alert} onChange={(event) => setAlert(event.target.value)}>
          <option value="">Any alert</option>
          <option value="green">Green</option>
          <option value="orange">Orange</option>
          <option value="red">Red</option>
        </select>
      </div>

      {error ? <Banner>{error}</Banner> : null}
      {loading ? <Loading label="Loading tasks" /> : null}
      {!loading && tasks.length === 0 ? (
        <Empty title="Nothing in this view">
          Change the filters, or generate the current period from Assign.
        </Empty>
      ) : null}

      {!loading && tasks.length > 0 ? (
        <Card>
          <p className="border-b border-line px-4 py-3 text-sm text-muted">
            {tasks.filter((task) => task.status !== 'completed').length} open
            <span className="px-2">·</span>
            {tasks.filter((task) => task.status === 'completed').length} closed
          </p>
          <div className="hidden grid-cols-12 gap-3 border-b border-line px-4 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted md:grid">
            <div className="col-span-5">Task</div>
            <div className="col-span-2">Due</div>
            <div className="col-span-2">{user?.role === 'admin' ? 'Assignee' : 'Status'}</div>
            <div className="col-span-3">Alert</div>
          </div>
          <ul>
            {tasks.map((task) => (
              <li key={task._id} className="border-b border-line last:border-b-0">
                <Link to={`/tasks/${task._id}`} className="grid gap-2 px-4 py-4 hover:bg-[#faf6ef] md:grid-cols-12 md:items-center">
                  <span className="md:col-span-5">
                    <span className="block text-sm font-medium">{task.title}</span>
                    <span className="mt-1 block text-xs text-muted">
                      {task.issueRemark ? 'Issue noted' : task.equipment?.name || frequencyLabel(task.frequency)}
                    </span>
                  </span>
                  <span className="text-sm text-muted md:col-span-2">{formatWhen(task.dueAt)}</span>
                  <span className="text-sm md:col-span-2">
                    {user?.role === 'admin' ? task.assignedTo?.name : <Pill tone={task.status}>{statusLabel(task.status)}</Pill>}
                  </span>
                  <span className="flex flex-wrap gap-2 md:col-span-3">
                    {user?.role === 'admin' ? <Pill tone={task.status}>{statusLabel(task.status)}</Pill> : null}
                    <Pill tone={task.alert}>{alertLabel(task.alert)}</Pill>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}

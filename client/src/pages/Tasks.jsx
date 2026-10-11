import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Banner, Button, Card, Empty, Loading, PageHeader, Pill, Segment, inputClass } from '../components/ui';
import { alertLabel, cx, formatWhen, frequencyLabel, statusLabel } from '../lib/format';

const rail = {
  green: 'border-l-pine',
  orange: 'border-l-amber',
  red: 'border-l-signal',
};

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

  const openCount = tasks.filter((task) => task.status !== 'completed').length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tasks"
        lede={user?.role === 'admin' ? 'Every check on the desk, ordered with open work first.' : 'Checks assigned to you, ordered with open work first.'}
        actions={user?.role === 'admin' ? <Link to="/schedule"><Button>Assign work</Button></Link> : null}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segment
          value={frequency}
          onChange={setFrequency}
          options={[
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
          ]}
        />
        {!loading ? (
          <p className="font-mono text-[12px] text-muted">{openCount} open · {tasks.length - openCount} closed</p>
        ) : null}
      </div>

      <div className="grid gap-2 md:grid-cols-3">
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
          <div className="hidden grid-cols-12 gap-3 border-b border-line bg-[#f7f8fa] px-4 py-2 text-[12px] text-muted md:grid">
            <div className="col-span-5">Task</div>
            <div className="col-span-2">Due</div>
            <div className="col-span-2">{user?.role === 'admin' ? 'Assignee' : 'Status'}</div>
            <div className="col-span-3">Alert</div>
          </div>
          <ul>
            {tasks.map((task) => (
              <li key={task._id} className="border-b border-line last:border-b-0">
                <Link
                  to={`/tasks/${task._id}`}
                  className={cx('grid gap-1 border-l-2 px-4 py-2.5 hover:bg-canvas md:grid-cols-12 md:items-center', rail[task.alert])}
                >
                  <span className="md:col-span-5">
                    <span className="block text-sm">{task.title}</span>
                    <span className="mt-0.5 block text-[12px] text-muted">
                      {task.issueRemark ? 'Issue noted' : task.equipment?.name || frequencyLabel(task.frequency)}
                    </span>
                  </span>
                  <span className="font-mono text-[12px] text-muted md:col-span-2">{formatWhen(task.dueAt)}</span>
                  <span className="text-sm md:col-span-2">
                    {user?.role === 'admin' ? task.assignedTo?.name : <Pill tone={task.status}>{statusLabel(task.status)}</Pill>}
                  </span>
                  <span className="flex flex-wrap items-center gap-3 md:col-span-3">
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

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Banner, Card, Kpi, Loading, Pill } from '../components/ui';
import { alertLabel, formatWhen, frequencyLabel, greeting, statusLabel } from '../lib/format';

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    Promise.all([api.get('/api/reports/summary'), api.get('/api/tasks')])
      .then(([report, board]) => {
        if (cancel) return;
        setSummary(report);
        setTasks(board.tasks);
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
  }, []);

  if (loading) return <Loading />;
  if (error) return <Banner>{error}</Banner>;
  if (!summary) return null;

  const attention = [...tasks]
    .filter((task) => task.alert !== 'green')
    .sort((a, b) => (a.alert === 'red' ? -1 : 1) - (b.alert === 'red' ? -1 : 1))
    .slice(0, 6);
  const first = user?.name?.split(' ')[0] || '';

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-brass">
          {user?.role === 'admin' ? 'Whole desk' : 'Your shift'}
        </p>
        <h1 className="mt-2 font-serif text-4xl">{greeting()}, {first}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          {summary.totals.compliance}% of work already due is closed.
          Green is on time, orange is closing in or carries an issue remark, red is overdue or has an open incident.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Compliance" value={`${summary.totals.compliance}%`} hint={`${summary.totals.due} tasks already due`} />
        <Kpi label="Open work" value={summary.totals.pending + summary.totals.inProgress} hint="Pending and in progress in this range" />
        <Kpi label="Red alerts" value={summary.alerts.red} hint="Overdue or an unresolved incident" />
        <Kpi label="Open incidents" value={summary.openIncidents} hint="Still waiting on a resolution" />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="p-5 lg:col-span-7">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-serif text-2xl">Daily closures</h2>
            <Link to="/reports" className="text-sm text-brass">Open reports</Link>
          </div>
          <div className="mt-4 h-64">
            <Bar
              data={{
                labels: summary.dailyTrend.map((day) => day.label),
                datasets: [
                  {
                    label: 'Closed',
                    data: summary.dailyTrend.map((day) => day.completed),
                    backgroundColor: '#1b7f4e',
                    borderRadius: 4,
                  },
                  {
                    label: 'Still open',
                    data: summary.dailyTrend.map((day) => Math.max(day.total - day.completed, 0)),
                    backgroundColor: '#e4d9c6',
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                scales: {
                  x: { stacked: true, grid: { display: false } },
                  y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } },
                },
              }}
            />
          </div>
        </Card>
        <Card className="p-5 lg:col-span-5">
          <h2 className="font-serif text-2xl">Cadence</h2>
          <div className="mt-5 space-y-5">
            {['daily', 'weekly', 'monthly'].map((frequency) => {
              const stats = summary.byFrequency[frequency];
              return (
                <div key={frequency}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium">{frequencyLabel(frequency)}</span>
                    <span className="tabular-nums">{stats.compliance}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-pine" style={{ width: `${stats.compliance}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted">{stats.completed} closed of {stats.total} in range</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-2xl">Needs a look</h2>
            <Link to="/tasks" className="text-sm text-brass">All tasks</Link>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {attention.length === 0 ? <li className="py-6 text-sm text-muted">Nothing is orange or red.</li> : null}
            {attention.map((task) => (
              <li key={task._id}>
                <Link to={`/tasks/${task._id}`} className="flex items-center justify-between gap-3 py-3">
                  <span>
                    <span className="block text-sm font-medium">{task.title}</span>
                    <span className="text-xs text-muted">{frequencyLabel(task.frequency)} · due {formatWhen(task.dueAt)}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Pill tone={task.status}>{statusLabel(task.status)}</Pill>
                    <Pill tone={task.alert}>{alertLabel(task.alert)}</Pill>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-2xl">Incident log</h2>
            <Link to="/incidents" className="text-sm text-brass">Open log</Link>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {summary.recentIncidents.length === 0 ? <li className="py-6 text-sm text-muted">No incidents in this range.</li> : null}
            {summary.recentIncidents.map((incident) => (
              <li key={incident._id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm">{incident.message}</p>
                  <Pill tone={incident.status}>{statusLabel(incident.status)}</Pill>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {incident.task?.title} · {incident.reportedBy?.name} · {formatWhen(incident.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

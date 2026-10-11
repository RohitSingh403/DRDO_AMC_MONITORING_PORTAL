import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Banner, Card, Loading, PageHeader, PanelTitle, Pill, StatStrip } from '../components/ui';
import { alertLabel, formatWhen, frequencyLabel, statusLabel } from '../lib/format';

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, boxHeight: 8 } } },
  scales: {
    x: { stacked: true, grid: { display: false }, ticks: { font: { size: 11 } } },
    y: { stacked: true, beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#e6e9ee' } },
  },
};

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

  if (loading) return <Loading label="Loading the board" />;
  if (error) return <Banner>{error}</Banner>;
  if (!summary) return null;

  const attention = [...tasks]
    .filter((task) => task.alert !== 'green')
    .sort((a, b) => (a.alert === 'red' ? -1 : 1) - (b.alert === 'red' ? -1 : 1))
    .slice(0, 6);

  return (
    <div className="space-y-4">
      <PageHeader
        title={user?.role === 'admin' ? 'Board' : 'My shift'}
        lede={`${summary.totals.compliance}% of work already due is closed. Green is on time. Orange is due soon or has an issue remark. Red is overdue or tied to an open incident.`}
      />

      <StatStrip
        items={[
          { label: 'Compliance', value: `${summary.totals.compliance}%`, hint: `${summary.totals.due} tasks already due` },
          { label: 'Open work', value: summary.totals.pending + summary.totals.inProgress, hint: 'Pending and in progress' },
          { label: 'Red alerts', value: summary.alerts.red, hint: 'Overdue or an open incident' },
          { label: 'Open incidents', value: summary.openIncidents, hint: 'Waiting on a resolution' },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <PanelTitle action={<Link to="/reports" className="text-[13px] text-link">Reports</Link>}>
            Daily closures
          </PanelTitle>
          <div className="h-64 p-4">
            <Bar
              data={{
                labels: summary.dailyTrend.map((day) => day.label),
                datasets: [
                  {
                    label: 'Closed',
                    data: summary.dailyTrend.map((day) => day.completed),
                    backgroundColor: '#1a2332',
                    borderRadius: 0,
                    maxBarThickness: 28,
                  },
                  {
                    label: 'Still open',
                    data: summary.dailyTrend.map((day) => Math.max(day.total - day.completed, 0)),
                    backgroundColor: '#d5dae2',
                    borderRadius: 0,
                    maxBarThickness: 28,
                  },
                ],
              }}
              options={chartOptions}
            />
          </div>
        </Card>
        <Card className="lg:col-span-5">
          <PanelTitle>Cadence</PanelTitle>
          <div className="space-y-4 p-4">
            {['daily', 'weekly', 'monthly'].map((frequency) => {
              const stats = summary.byFrequency[frequency];
              return (
                <div key={frequency}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span>{frequencyLabel(frequency)}</span>
                    <span className="font-mono tabular-nums">{stats.compliance}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 bg-[#e6e9ee]">
                    <div className="h-full bg-navy" style={{ width: `${stats.compliance}%` }} />
                  </div>
                  <p className="mt-1 text-[12px] text-muted">{stats.completed} closed of {stats.total}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <PanelTitle action={<Link to="/tasks" className="text-[13px] text-link">All tasks</Link>}>
            Needs attention
          </PanelTitle>
          <ul>
            {attention.length === 0 ? <li className="px-4 py-6 text-sm text-muted">Nothing is orange or red.</li> : null}
            {attention.map((task) => (
              <li key={task._id} className="border-t border-line">
                <Link to={`/tasks/${task._id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-canvas">
                  <span className="min-w-0">
                    <span className="block truncate text-sm">{task.title}</span>
                    <span className="font-mono text-[11px] text-muted">{frequencyLabel(task.frequency)} · {formatWhen(task.dueAt)}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <Pill tone={task.status}>{statusLabel(task.status)}</Pill>
                    <Pill tone={task.alert}>{alertLabel(task.alert)}</Pill>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <PanelTitle action={<Link to="/incidents" className="text-[13px] text-link">Incident log</Link>}>
            Recent incidents
          </PanelTitle>
          <ul>
            {summary.recentIncidents.length === 0 ? <li className="px-4 py-6 text-sm text-muted">No incidents in this range.</li> : null}
            {summary.recentIncidents.map((incident) => (
              <li key={incident._id} className="border-t border-line px-4 py-2.5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm">{incident.message}</p>
                  <Pill tone={incident.status}>{statusLabel(incident.status)}</Pill>
                </div>
                <p className="mt-1 font-mono text-[11px] text-muted">
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

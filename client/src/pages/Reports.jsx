import { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { api } from '../lib/api';
import { Banner, Card, Loading, inputClass } from '../components/ui';
import { formatDateInput, frequencyLabel } from '../lib/format';

function rangeToIso(from, to) {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  return {
    from: new Date(fy, fm - 1, fd, 0, 0, 0, 0).toISOString(),
    to: new Date(ty, tm - 1, td, 23, 59, 59, 999).toISOString(),
  };
}

export default function Reports() {
  const today = new Date();
  const [from, setFrom] = useState(formatDateInput(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [to, setTo] = useState(formatDateInput(today));
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const range = rangeToIso(from, to);
    const params = new URLSearchParams(range);
    let cancel = false;
    setLoading(true);
    api.get(`/api/reports/summary?${params.toString()}`)
      .then((data) => {
        if (!cancel) setSummary(data);
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
  }, [from, to]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-brass">Reports</p>
        <h1 className="mt-2 font-serif text-4xl">Desk report</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Compliance is closed work divided by tasks that are already due. Future checks do not lower the percentage.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 md:max-w-lg">
        <label className="text-sm">
          <span className="mb-1.5 block font-medium">From</span>
          <input className={inputClass} type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1.5 block font-medium">To</span>
          <input className={inputClass} type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
      </div>
      {error ? <Banner>{error}</Banner> : null}
      {loading || !summary ? <Loading label="Building the report" /> : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="font-serif text-2xl">Compliance by cadence</h2>
              <div className="mt-4 h-64">
                <Bar
                  data={{
                    labels: ['Daily', 'Weekly', 'Monthly'],
                    datasets: [{
                      label: 'Compliance %',
                      data: ['daily', 'weekly', 'monthly'].map((key) => summary.byFrequency[key].compliance),
                      backgroundColor: ['#142033', '#8d6a3f', '#1b7f4e'],
                      borderRadius: 4,
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, max: 100 } },
                  }}
                />
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="font-serif text-2xl">Alert mix</h2>
              <div className="mx-auto mt-4 h-64 max-w-xs">
                <Doughnut
                  data={{
                    labels: ['Green', 'Orange', 'Red'],
                    datasets: [{
                      data: [summary.alerts.green, summary.alerts.orange, summary.alerts.red],
                      backgroundColor: ['#1b7f4e', '#c56a12', '#b42318'],
                      borderWidth: 0,
                    }],
                  }}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
                />
              </div>
            </Card>
          </div>
          <Card>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-[11px] uppercase tracking-[0.14em] text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Cadence</th>
                  <th className="px-4 py-3 font-medium">In range</th>
                  <th className="px-4 py-3 font-medium">Closed</th>
                  <th className="px-4 py-3 font-medium">Already due</th>
                  <th className="px-4 py-3 font-medium">Compliance</th>
                </tr>
              </thead>
              <tbody>
                {['daily', 'weekly', 'monthly'].map((key) => {
                  const row = summary.byFrequency[key];
                  return (
                    <tr key={key} className="border-b border-line last:border-b-0">
                      <td className="px-4 py-3">{frequencyLabel(key)}</td>
                      <td className="px-4 py-3 tabular-nums">{row.total}</td>
                      <td className="px-4 py-3 tabular-nums">{row.completed}</td>
                      <td className="px-4 py-3 tabular-nums">{row.due}</td>
                      <td className="px-4 py-3 tabular-nums">{row.compliance}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}

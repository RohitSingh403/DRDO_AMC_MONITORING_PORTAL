import { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { api } from '../lib/api';
import { Banner, Card, Field, Loading, PageHeader, PanelTitle, inputClass } from '../components/ui';
import { formatDateInput, frequencyLabel } from '../lib/format';

function rangeToIso(from, to) {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  return {
    from: new Date(fy, fm - 1, fd, 0, 0, 0, 0).toISOString(),
    to: new Date(ty, tm - 1, td, 23, 59, 59, 999).toISOString(),
  };
}

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, max: 100, grid: { color: '#e6e9ee' } },
    x: { grid: { display: false } },
  },
};

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
    <div className="space-y-4">
      <PageHeader
        title="Reports"
        lede="Compliance is closed work divided by tasks that are already due. Checks that are not due yet do not lower the percentage."
      />
      <div className="grid gap-3 sm:grid-cols-2 md:max-w-lg">
        <Field label="From">
          <input className={inputClass} type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </Field>
        <Field label="To">
          <input className={inputClass} type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </Field>
      </div>
      {error ? <Banner>{error}</Banner> : null}
      {loading ? <Loading label="Building the report" /> : null}
      {!loading && summary ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <PanelTitle>Compliance by cadence</PanelTitle>
              <div className="h-64 p-4">
                <Bar
                  data={{
                    labels: ['Daily', 'Weekly', 'Monthly'],
                    datasets: [{
                      label: 'Compliance %',
                      data: ['daily', 'weekly', 'monthly'].map((key) => summary.byFrequency[key].compliance),
                      backgroundColor: '#1a2332',
                      maxBarThickness: 36,
                    }],
                  }}
                  options={barOptions}
                />
              </div>
            </Card>
            <Card>
              <PanelTitle>Alert mix</PanelTitle>
              <div className="mx-auto h-64 max-w-xs p-4">
                <Doughnut
                  data={{
                    labels: ['Green', 'Orange', 'Red'],
                    datasets: [{
                      data: [summary.alerts.green, summary.alerts.orange, summary.alerts.red],
                      backgroundColor: ['#1f7a4d', '#d97706', '#c2412a'],
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
              <thead className="border-b border-line bg-[#f7f8fa] text-[12px] text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Cadence</th>
                  <th className="px-4 py-2 font-medium">In range</th>
                  <th className="px-4 py-2 font-medium">Closed</th>
                  <th className="px-4 py-2 font-medium">Already due</th>
                  <th className="px-4 py-2 font-medium">Compliance</th>
                </tr>
              </thead>
              <tbody>
                {['daily', 'weekly', 'monthly'].map((key) => {
                  const row = summary.byFrequency[key];
                  return (
                    <tr key={key} className="border-b border-line last:border-b-0">
                      <td className="px-4 py-2.5">{frequencyLabel(key)}</td>
                      <td className="px-4 py-2.5 font-mono tabular-nums">{row.total}</td>
                      <td className="px-4 py-2.5 font-mono tabular-nums">{row.completed}</td>
                      <td className="px-4 py-2.5 font-mono tabular-nums">{row.due}</td>
                      <td className="px-4 py-2.5 font-mono tabular-nums">{row.compliance}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
      ) : null}
    </div>
  );
}

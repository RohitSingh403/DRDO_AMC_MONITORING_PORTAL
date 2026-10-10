import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Banner, Button, Card, Field, Loading, inputClass } from '../components/ui';
import { formatDateTimeInput, frequencyLabel } from '../lib/format';

const modes = [
  { id: 'catalog', label: 'From the catalog' },
  { id: 'custom', label: 'Custom task' },
  { id: 'complaint', label: 'Complaint' },
];

export default function Schedule() {
  const [templates, setTemplates] = useState([]);
  const [users, setUsers] = useState([]);
  const [mode, setMode] = useState('catalog');
  const [templateId, setTemplateId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [checklistText, setChecklistText] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueAt, setDueAt] = useState(formatDateTimeInput(new Date(Date.now() + 4 * 60 * 60 * 1000)));
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [taskId, setTaskId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/api/templates'), api.get('/api/users')])
      .then(([catalog, people]) => {
        setTemplates(catalog.templates);
        const personnel = people.users.filter((user) => user.role === 'personnel');
        setUsers(personnel);
        setTemplateId(catalog.templates[0]?._id || '');
        setAssignedTo(personnel[0]?.id || '');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => ({
    daily: templates.filter((item) => item.frequency === 'daily'),
    weekly: templates.filter((item) => item.frequency === 'weekly'),
    monthly: templates.filter((item) => item.frequency === 'monthly'),
  }), [templates]);

  async function generate(nextFrequency) {
    setBusy(true);
    setError('');
    setNotice('');
    setTaskId('');
    try {
      const result = await api.post('/api/tasks/generate', { frequency: nextFrequency });
      setNotice(`Created ${result.created}. ${result.skipped} were already on the board.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    setTaskId('');
    const payload = {
      assignedTo,
      dueAt: new Date(dueAt).toISOString(),
    };
    if (mode === 'catalog') payload.templateId = templateId;
    if (mode === 'custom') {
      payload.title = title;
      payload.description = description;
      payload.frequency = frequency;
      payload.checklist = checklistText.split('\n').map((line) => line.trim()).filter(Boolean);
    }
    if (mode === 'complaint') {
      payload.title = title.trim() ? `Complaint: ${title.trim()}` : 'Complaint';
      payload.description = description;
      payload.frequency = 'daily';
      payload.checklist = ['Complaint logged', 'Work done', 'Caller updated'];
    }
    try {
      const data = await api.post('/api/tasks', payload);
      setNotice('Task assigned.');
      setTaskId(data.task._id);
    } catch (err) {
      setError(err.message);
      if (err.data?.taskId) setTaskId(err.data.taskId);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loading label="Loading the catalog" />;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-brass">Scheduling</p>
        <h1 className="mt-2 font-serif text-4xl">Assign work</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Generate the standing checks for this period, or assign a catalog item, a custom task, or a complaint.
        </p>
      </header>

      {error ? <Banner>{error} {taskId ? <Link className="underline" to={`/tasks/${taskId}`}>Open the task</Link> : null}</Banner> : null}
      {notice ? <Banner tone="ok">{notice} {taskId ? <Link className="underline" to={`/tasks/${taskId}`}>Open the task</Link> : null}</Banner> : null}

      <Card className="p-5">
        <h2 className="font-serif text-2xl">Generate the current period</h2>
        <p className="mt-2 text-sm text-muted">Missing daily, weekly, or monthly checks are created and assigned. Existing ones are left as they are.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {['daily', 'weekly', 'monthly', 'all'].map((item) => (
            <Button key={item} variant="quiet" disabled={busy} onClick={() => generate(item)}>
              {item === 'all' ? 'Generate all' : `Generate ${frequencyLabel(item).toLowerCase()}`}
            </Button>
          ))}
        </div>
      </Card>

      <form className="grid gap-4 lg:grid-cols-5" onSubmit={submit}>
        <Card className="space-y-4 p-5 lg:col-span-3">
          <div className="flex flex-wrap gap-2">
            {modes.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={`rounded-full px-4 py-1.5 text-sm ${mode === item.id ? 'bg-ink text-paper' : 'border border-line bg-white'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {mode === 'catalog' ? (
            <Field label="Catalog check">
              <select className={inputClass} value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
                {['daily', 'weekly', 'monthly'].map((frequencyKey) => (
                  <optgroup key={frequencyKey} label={frequencyLabel(frequencyKey)}>
                    {grouped[frequencyKey].map((item) => (
                      <option key={item._id} value={item._id}>{item.title}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
          ) : null}
          {mode === 'custom' ? (
            <>
              <Field label="Title">
                <input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} required />
              </Field>
              <Field label="Cadence">
                <select className={inputClass} value={frequency} onChange={(event) => setFrequency(event.target.value)}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </Field>
              <Field label="Checklist" hint="One row per line.">
                <textarea className={`${inputClass} min-h-24`} value={checklistText} onChange={(event) => setChecklistText(event.target.value)} />
              </Field>
            </>
          ) : null}
          {mode === 'complaint' ? (
            <Field label="Subject">
              <input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Printer jam at the admin bay" />
            </Field>
          ) : null}
          {mode !== 'catalog' ? (
            <Field label={mode === 'complaint' ? 'What was reported' : 'Description'}>
              <textarea className={`${inputClass} min-h-28`} value={description} onChange={(event) => setDescription(event.target.value)} required={mode === 'complaint'} />
            </Field>
          ) : null}
        </Card>
        <Card className="space-y-4 p-5 lg:col-span-2">
          <h2 className="font-serif text-2xl">Who and when</h2>
          <Field label="AMC personnel">
            <select className={inputClass} value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} required>
              {users.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
            </select>
          </Field>
          <Field label="Due">
            <input className={inputClass} type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} required />
          </Field>
          <Button type="submit" disabled={busy || !assignedTo}>{busy ? 'Saving…' : 'Assign task'}</Button>
        </Card>
      </form>
    </div>
  );
}

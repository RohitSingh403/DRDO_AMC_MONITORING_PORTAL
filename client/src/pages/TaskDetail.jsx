import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, fileUrl } from '../lib/api';
import { Banner, Button, Card, Field, Loading, PageHeader, PanelTitle, Pill, inputClass } from '../components/ui';
import { alertLabel, formatWhen, frequencyLabel, statusLabel } from '../lib/format';

export default function TaskDetail() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [form, setForm] = useState(null);
  const [logIncident, setLogIncident] = useState(false);
  const [severity, setSeverity] = useState('medium');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  function applyTask(next) {
    setTask(next);
    setForm({
      status: next.status,
      completionRemark: next.completionRemark || '',
      issueRemark: next.issueRemark || '',
      checklist: next.checklist.map((item) => ({ ...item })),
    });
  }

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    api.get(`/api/tasks/${id}`)
      .then((data) => {
        if (!cancel) applyTask(data.task);
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
  }, [id]);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const data = await api.patch(`/api/tasks/${id}`, form);
      if (logIncident && form.issueRemark.trim()) {
        await api.post('/api/incidents', {
          taskId: id,
          message: form.issueRemark.trim(),
          severity,
        });
        setLogIncident(false);
      }
      const fresh = await api.get(`/api/tasks/${id}`);
      applyTask(fresh.task || data.task);
      setNotice('Update saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    const body = new FormData();
    body.append('file', file);
    try {
      const data = await api.upload(`/api/tasks/${id}/attachments`, body);
      applyTask(data.task);
      setNotice('File attached.');
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <Loading label="Opening the task" />;
  if (!task) return <Banner>{error || 'Task not found'}</Banner>;

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-muted">
        <Link to="/tasks" className="text-link">Tasks</Link>
        <span className="px-1.5">/</span>
        {frequencyLabel(task.frequency)}
      </p>
      <PageHeader
        title={task.title}
        lede={task.description}
        actions={(
          <>
            <Pill tone={task.status}>{statusLabel(task.status)}</Pill>
            <Pill tone={task.alert}>{alertLabel(task.alert)}</Pill>
          </>
        )}
      />

      {error ? <Banner>{error}</Banner> : null}
      {notice ? <Banner tone="ok">{notice}</Banner> : null}
      {task.hasOpenIncident ? (
        <Banner>This task has an open incident, so the alert stays red until an admin resolves it. <Link to="/incidents" className="underline">Open the log</Link></Banner>
      ) : null}

      <Card>
        <div className="grid text-sm sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Assigned to', task.assignedTo?.name],
            ['Assigned by', task.assignedBy?.name],
            ['Due', formatWhen(task.dueAt)],
            ['Started / finished', `${formatWhen(task.startedAt)} · ${formatWhen(task.completedAt)}`],
          ].map(([label, value], index) => (
            <p key={label} className={`px-4 py-3 ${index > 0 ? 'border-t border-line sm:border-t-0 sm:border-l' : ''} ${index >= 2 ? 'lg:border-t-0' : ''} ${index === 2 ? 'sm:border-t lg:border-t-0' : ''}`}>
              <span className="block text-[12px] text-muted">{label}</span>
              <span className="mt-1 block">{value}</span>
            </p>
          ))}
        </div>
        {task.equipment ? (
          <p className="border-t border-line px-4 py-3 text-sm">
            <span className="block text-[12px] text-muted">Equipment</span>
            <Link className="text-link" to={`/equipment/${task.equipment._id}`}>{task.equipment.name}</Link>
          </p>
        ) : null}
      </Card>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <PanelTitle>Checklist</PanelTitle>
          {form.checklist.length === 0 ? <p className="px-4 py-4 text-sm text-muted">This task has no checklist rows.</p> : null}
          <ul>
            {form.checklist.map((item, index) => (
              <li key={item.label} className="border-t border-line px-4 py-3">
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={item.done}
                    onChange={(event) => {
                      const checklist = form.checklist.map((row, rowIndex) => (
                        rowIndex === index ? { ...row, done: event.target.checked } : row
                      ));
                      setForm({ ...form, checklist });
                    }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className={item.done ? 'text-muted line-through' : 'font-medium'}>{item.label}</span>
                    <input
                      className={`${inputClass} mt-2`}
                      placeholder="Note for this row"
                      value={item.note}
                      onChange={(event) => {
                        const checklist = form.checklist.map((row, rowIndex) => (
                          rowIndex === index ? { ...row, note: event.target.value } : row
                        ));
                        setForm({ ...form, checklist });
                      }}
                    />
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </Card>

        <form className="lg:col-span-2" onSubmit={save}>
          <Card>
            <PanelTitle>Update</PanelTitle>
            <div className="space-y-3 p-4">
              <Field label="Status">
                <select className={inputClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In progress</option>
                  <option value="completed">Completed</option>
                </select>
              </Field>
              <Field label="Completion remark" hint="Required before the task can be closed. Include the time you finished.">
                <textarea className={`${inputClass} min-h-24`} value={form.completionRemark} onChange={(event) => setForm({ ...form, completionRemark: event.target.value })} />
              </Field>
              <Field label="Issue remark" hint="A problem found during the work. Kept separate from the completion remark.">
                <textarea className={`${inputClass} min-h-24`} value={form.issueRemark} onChange={(event) => setForm({ ...form, issueRemark: event.target.value })} />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={logIncident} onChange={(event) => setLogIncident(event.target.checked)} />
                Also log the issue remark as an incident
              </label>
              {logIncident ? (
                <Field label="Severity">
                  <select className={inputClass} value={severity} onChange={(event) => setSeverity(event.target.value)}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </Field>
              ) : null}
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save update'}</Button>
            </div>
          </Card>
        </form>
      </div>

      <Card>
        <PanelTitle
          action={(
            <label className="cursor-pointer border border-line bg-white px-2.5 py-1 text-[13px] hover:border-ink">
              Add photo, screenshot, or PDF
              <input className="sr-only" type="file" accept="image/jpeg,image/png,application/pdf" onChange={upload} />
            </label>
          )}
        >
          Proof
        </PanelTitle>
        {task.attachments.length === 0 ? <p className="px-4 py-4 text-sm text-muted">No files yet.</p> : null}
        <ul className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          {task.attachments.map((file) => (
            <li key={file._id || file.filename} className="bg-white">
              {file.mimeType?.startsWith('image/') ? (
                <img src={fileUrl(file.filename)} alt={file.originalName} className="h-36 w-full object-cover" />
              ) : (
                <div className="grid h-36 place-items-center font-mono text-[12px] text-muted">PDF</div>
              )}
              <a className="block truncate px-3 py-2 text-sm text-link" href={fileUrl(file.filename)} target="_blank" rel="noreferrer">
                {file.originalName}
              </a>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

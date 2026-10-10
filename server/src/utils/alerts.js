const SOON_HOURS = {
  daily: 4,
  weekly: 24,
  monthly: 72,
};

export function alertFor(task, hasOpenIncident, now = new Date()) {
  if (hasOpenIncident) return 'red';

  if (task.status === 'completed') {
    if (task.issueRemark && task.issueRemark.trim()) return 'orange';
    if (task.completedAt && task.dueAt && new Date(task.completedAt) > new Date(task.dueAt)) return 'red';
    return 'green';
  }

  const dueAt = new Date(task.dueAt);
  if (now > dueAt) return 'red';

  const hoursLeft = (dueAt - now) / 36e5;
  const soon = SOON_HOURS[task.frequency] ?? 4;
  if (hoursLeft <= soon) return 'orange';
  return 'green';
}

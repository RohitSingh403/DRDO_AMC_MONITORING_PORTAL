export function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function formatWhen(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatDay(value) {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(value ? new Date(value) : new Date());
}

export function formatDateInput(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatDateTimeInput(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${formatDateInput(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function roleLabel(role) {
  return role === 'admin' ? 'IT Admin' : 'AMC Personnel';
}

export function statusLabel(status) {
  if (status === 'in-progress') return 'In progress';
  if (status === 'completed') return 'Completed';
  if (status === 'operational') return 'Operational';
  if (status === 'attention') return 'Needs attention';
  if (status === 'offline') return 'Offline';
  if (status === 'open') return 'Open';
  if (status === 'resolved') return 'Resolved';
  return 'Pending';
}

export function alertLabel(alert) {
  if (alert === 'orange') return 'Orange';
  if (alert === 'red') return 'Red';
  return 'Green';
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function frequencyLabel(frequency) {
  if (frequency === 'weekly') return 'Weekly';
  if (frequency === 'monthly') return 'Monthly';
  return 'Daily';
}

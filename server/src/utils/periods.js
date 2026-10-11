export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatDate(date) {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addMonths(date, months) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function isoWeekKey(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function periodKeyFor(frequency, date) {
  const d = new Date(date);
  if (frequency === 'daily') return formatDate(d);
  if (frequency === 'monthly') {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  return isoWeekKey(d);
}

export function windowFor(frequency, date) {
  const scheduledFor = startOfDay(date);
  if (frequency === 'daily') {
    const dueAt = new Date(scheduledFor);
    dueAt.setHours(18, 0, 0, 0);
    return { scheduledFor, dueAt };
  }
  if (frequency === 'weekly') {
    const day = scheduledFor.getDay() === 0 ? 7 : scheduledFor.getDay();
    const dueAt = new Date(scheduledFor);
    dueAt.setDate(scheduledFor.getDate() + (5 - day));
    dueAt.setHours(18, 0, 0, 0);
    return { scheduledFor, dueAt };
  }
  const dueAt = new Date(scheduledFor.getFullYear(), scheduledFor.getMonth() + 1, 0, 18, 0, 0, 0);
  return { scheduledFor, dueAt };
}

export function eachDay(from, to, limit = 366) {
  const days = [];
  const cursor = startOfDay(from);
  const end = startOfDay(to);
  while (cursor <= end && days.length < limit) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

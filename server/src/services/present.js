import { Incident } from '../models/Incident.js';
import { alertFor } from '../utils/alerts.js';

const taskPopulate = [
  { path: 'assignedTo', select: 'name email role' },
  { path: 'assignedBy', select: 'name email role' },
  { path: 'equipment', select: 'name location category status serial' },
  { path: 'template', select: 'key title frequency' },
];

export function populateTask(query) {
  return query.populate(taskPopulate);
}

export async function withAlerts(tasks, now = new Date()) {
  if (!tasks.length) return [];
  const open = await Incident.find({
    task: { $in: tasks.map((task) => task._id) },
    status: 'open',
  }).select('task');
  const openSet = new Set(open.map((incident) => String(incident.task)));
  return tasks.map((task) => {
    const obj = typeof task.toObject === 'function' ? task.toObject() : { ...task };
    const hasOpenIncident = openSet.has(String(task._id));
    obj.alert = alertFor(task, hasOpenIncident, now);
    obj.hasOpenIncident = hasOpenIncident;
    return obj;
  });
}

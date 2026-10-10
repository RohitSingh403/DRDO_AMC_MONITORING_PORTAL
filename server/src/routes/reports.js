import { Router } from 'express';
import { Task } from '../models/Task.js';
import { Incident } from '../models/Incident.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async.js';
import { withAlerts } from '../services/present.js';
import { eachDay, formatDate } from '../utils/periods.js';

const router = Router();

function complianceOf(list, now) {
  const due = list.filter((task) => task.status === 'completed' || new Date(task.dueAt) <= now);
  if (!due.length) return { due: 0, compliance: 100 };
  const done = due.filter((task) => task.status === 'completed').length;
  return { due: due.length, compliance: Math.round((done / due.length) * 100) };
}

function bucket(list, now) {
  const completed = list.filter((task) => task.status === 'completed').length;
  const pending = list.filter((task) => task.status === 'pending').length;
  const inProgress = list.filter((task) => task.status === 'in-progress').length;
  const score = complianceOf(list, now);
  return {
    total: list.length,
    completed,
    pending,
    inProgress,
    due: score.due,
    compliance: score.compliance,
  };
}

router.get('/summary', requireAuth, asyncHandler(async (req, res) => {
  const now = new Date();
  const from = req.query.from ? new Date(req.query.from) : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = req.query.to
    ? new Date(req.query.to)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return res.status(400).json({ message: 'Use a valid date range' });
  }

  const filter = { dueAt: { $gte: from, $lte: to } };
  if (req.user.role === 'personnel') filter.assignedTo = req.user.id;

  const tasks = await Task.find(filter).populate('assignedTo', 'name');
  const decorated = await withAlerts(tasks, now);
  const totals = bucket(decorated, now);
  const byFrequency = {
    daily: bucket(decorated.filter((task) => task.frequency === 'daily'), now),
    weekly: bucket(decorated.filter((task) => task.frequency === 'weekly'), now),
    monthly: bucket(decorated.filter((task) => task.frequency === 'monthly'), now),
  };
  const alerts = {
    green: decorated.filter((task) => task.alert === 'green').length,
    orange: decorated.filter((task) => task.alert === 'orange').length,
    red: decorated.filter((task) => task.alert === 'red').length,
  };

  const openFilter = { status: 'open' };
  if (req.user.role === 'personnel') {
    const own = await Task.find({ assignedTo: req.user.id }).select('_id');
    openFilter.task = { $in: own.map((task) => task._id) };
  }
  const openIncidents = await Incident.countDocuments(openFilter);

  const recentFilter = { createdAt: { $gte: from, $lte: to } };
  if (openFilter.task) recentFilter.task = openFilter.task;
  const recentIncidents = await Incident.find(recentFilter)
    .sort({ createdAt: -1 })
    .limit(6)
    .populate('reportedBy', 'name')
    .populate('task', 'title');

  const dailyTrend = eachDay(from, to).map((day) => {
    const key = formatDate(day);
    const dayTasks = decorated.filter((task) => task.frequency === 'daily' && formatDate(task.scheduledFor) === key);
    return {
      date: key,
      label: new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(day),
      total: dayTasks.length,
      completed: dayTasks.filter((task) => task.status === 'completed').length,
    };
  }).filter((day) => day.total > 0);

  res.json({
    range: { from, to },
    totals: {
      ...totals,
      pending: totals.pending,
      inProgress: totals.inProgress,
    },
    byStatus: {
      pending: totals.pending,
      'in-progress': totals.inProgress,
      completed: totals.completed,
    },
    byFrequency,
    alerts,
    openIncidents,
    recentIncidents,
    dailyTrend,
  });
}));

export default router;

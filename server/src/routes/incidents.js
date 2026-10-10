import { Router } from 'express';
import mongoose from 'mongoose';
import { Incident } from '../models/Incident.js';
import { Task } from '../models/Task.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async.js';

const router = Router();

router.use(requireAuth);

function taskAccessFilter(user) {
  return user.role === 'personnel' ? { assignedTo: user.id } : {};
}

router.get('/', asyncHandler(async (req, res) => {
  const tasks = await Task.find(taskAccessFilter(req.user)).select('_id');
  const filter = { task: { $in: tasks.map((task) => task._id) } };
  if (req.query.status === 'open' || req.query.status === 'resolved') filter.status = req.query.status;
  const incidents = await Incident.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .populate('reportedBy', 'name role')
    .populate('task', 'title frequency')
    .populate('resolvedBy', 'name');
  res.json({ incidents });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { taskId, message, severity } = req.body;
  if (!taskId || !message || !String(message).trim()) {
    return res.status(400).json({ message: 'Choose a task and describe the incident' });
  }
  if (!mongoose.isValidObjectId(taskId)) return res.status(404).json({ message: 'Task not found' });
  const task = await Task.findById(taskId);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  if (req.user.role === 'personnel' && String(task.assignedTo) !== String(req.user.id)) {
    return res.status(404).json({ message: 'Task not found' });
  }
  const incident = await Incident.create({
    task: task._id,
    reportedBy: req.user.id,
    message: String(message).trim(),
    severity: ['low', 'medium', 'high'].includes(severity) ? severity : 'medium',
  });
  const populated = await Incident.findById(incident._id)
    .populate('reportedBy', 'name role')
    .populate('task', 'title frequency');
  res.status(201).json({ incident: populated });
}));

router.patch('/:id', requireAdmin, asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: 'Incident not found' });
  }
  const incident = await Incident.findById(req.params.id);
  if (!incident) return res.status(404).json({ message: 'Incident not found' });
  if (req.body.status !== 'resolved' && req.body.status !== 'open') {
    return res.status(400).json({ message: 'Status must be open or resolved' });
  }
  incident.status = req.body.status;
  if (req.body.status === 'resolved') {
    incident.resolvedAt = new Date();
    incident.resolvedBy = req.user.id;
  } else {
    incident.resolvedAt = null;
    incident.resolvedBy = null;
  }
  await incident.save();
  const populated = await Incident.findById(incident._id)
    .populate('reportedBy', 'name role')
    .populate('task', 'title frequency')
    .populate('resolvedBy', 'name');
  res.json({ incident: populated });
}));

export default router;

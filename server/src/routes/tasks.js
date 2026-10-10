import { Router } from 'express';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { Task } from '../models/Task.js';
import { TaskTemplate } from '../models/TaskTemplate.js';
import { User } from '../models/User.js';
import { Equipment } from '../models/Equipment.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async.js';
import { populateTask, withAlerts } from '../services/present.js';
import { generateOccurrences } from '../services/occurrences.js';
import { periodKeyFor, startOfDay } from '../utils/periods.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../uploads');

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.mimetype)) {
      cb(new Error('Upload a JPEG, PNG, or PDF under 5 MB'));
      return;
    }
    cb(null, true);
  },
});

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function canAccess(user, task) {
  if (user.role === 'admin') return true;
  const assignee = task.assignedTo?._id || task.assignedTo;
  return String(assignee) === String(user.id);
}

router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'personnel') filter.assignedTo = req.user.id;
  if (['daily', 'weekly', 'monthly'].includes(req.query.frequency)) {
    filter.frequency = req.query.frequency;
  }
  if (['pending', 'in-progress', 'completed'].includes(req.query.status)) {
    filter.status = req.query.status;
  }
  if (req.query.from || req.query.to) {
    filter.dueAt = {};
    if (req.query.from) filter.dueAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.dueAt.$lte = new Date(req.query.to);
  }
  if (req.query.q) {
    const pattern = escapeRegex(String(req.query.q).trim());
    filter.$or = [
      { title: { $regex: pattern, $options: 'i' } },
      { description: { $regex: pattern, $options: 'i' } },
    ];
  }

  const tasks = await populateTask(Task.find(filter).sort({ dueAt: 1 })).limit(500);
  let decorated = await withAlerts(tasks);
  if (['green', 'orange', 'red'].includes(req.query.alert)) {
    decorated = decorated.filter((task) => task.alert === req.query.alert);
  }
  res.json({ tasks: decorated });
}));

router.post('/generate', requireAdmin, asyncHandler(async (req, res) => {
  const frequency = req.body.frequency || 'all';
  if (!['daily', 'weekly', 'monthly', 'all'].includes(frequency)) {
    return res.status(400).json({ message: 'Frequency must be daily, weekly, monthly, or all' });
  }
  const personnel = await User.find({ role: 'personnel' });
  const result = await generateOccurrences({
    frequency,
    assignedBy: req.user.id,
    personnel,
  });
  return res.status(201).json(result);
}));

router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const { templateId, title, description, frequency, checklist, assignedTo, dueAt, equipmentId } = req.body;
  if (!assignedTo || !dueAt) {
    return res.status(400).json({ message: 'Choose a person and a due time' });
  }
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) {
    return res.status(400).json({ message: 'Due time is not a valid date' });
  }
  const assignee = await User.findOne({ _id: assignedTo, role: 'personnel' });
  if (!assignee) return res.status(400).json({ message: 'Assign the task to AMC personnel' });

  let template = null;
  let taskFrequency = frequency;
  let taskTitle = String(title || '').trim();
  let taskDescription = String(description || '').trim();
  let labels = Array.isArray(checklist) ? checklist.map((item) => String(item).trim()).filter(Boolean) : [];

  if (templateId) {
    if (!mongoose.isValidObjectId(templateId)) {
      return res.status(400).json({ message: 'Unknown catalog item' });
    }
    template = await TaskTemplate.findById(templateId);
    if (!template) return res.status(400).json({ message: 'Unknown catalog item' });
    taskFrequency = template.frequency;
    taskTitle = template.title;
    taskDescription = template.description;
    labels = template.checklist;
    const periodKey = periodKeyFor(template.frequency, due);
    const existing = await Task.findOne({ template: template._id, periodKey });
    if (existing) {
      return res.status(409).json({
        message: 'This check is already on the board for that period',
        taskId: existing._id,
      });
    }
  }

  if (!['daily', 'weekly', 'monthly'].includes(taskFrequency)) {
    return res.status(400).json({ message: 'Choose a daily, weekly, or monthly cadence' });
  }
  if (!taskTitle) return res.status(400).json({ message: 'Give the task a title' });

  let equipment = null;
  if (equipmentId) {
    equipment = await Equipment.findById(equipmentId);
  } else if (template?.equipmentSerial) {
    equipment = await Equipment.findOne({ serial: template.equipmentSerial });
  }

  const periodKey = template
    ? periodKeyFor(template.frequency, due)
    : `custom-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

  const task = await Task.create({
    template: template?._id || null,
    title: taskTitle,
    description: taskDescription,
    frequency: taskFrequency,
    checklist: labels.map((label) => ({ label, done: false, note: '' })),
    assignedTo: assignee._id,
    assignedBy: req.user.id,
    equipment: equipment?._id || null,
    scheduledFor: startOfDay(due),
    dueAt: due,
    periodKey,
  });

  const populated = await populateTask(Task.findById(task._id));
  const [decorated] = await withAlerts([populated]);
  return res.status(201).json({ task: decorated });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: 'Task not found' });
  }
  const task = await populateTask(Task.findById(req.params.id));
  if (!task || !canAccess(req.user, task)) {
    return res.status(404).json({ message: 'Task not found' });
  }
  const [decorated] = await withAlerts([task]);
  return res.json({ task: decorated });
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: 'Task not found' });
  }
  const task = await Task.findById(req.params.id);
  if (!task || !canAccess(req.user, task)) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const { status, completionRemark, issueRemark, checklist } = req.body;
  if (status !== undefined) {
    if (!['pending', 'in-progress', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Status must be pending, in progress, or completed' });
    }
    if (status === 'in-progress' && !task.startedAt) task.startedAt = new Date();
    if (status === 'completed') {
      const remark = completionRemark !== undefined ? String(completionRemark).trim() : task.completionRemark.trim();
      if (!remark) {
        return res.status(400).json({ message: 'Add a completion remark before closing the task' });
      }
      task.completedAt = task.completedAt || new Date();
      if (!task.startedAt) task.startedAt = task.completedAt;
    } else {
      task.completedAt = null;
    }
    task.status = status;
  }

  if (completionRemark !== undefined) task.completionRemark = String(completionRemark);
  if (issueRemark !== undefined) task.issueRemark = String(issueRemark);

  if (Array.isArray(checklist)) {
    const incoming = new Map(checklist.map((item) => [item.label, item]));
    task.checklist = task.checklist.map((item) => {
      const next = incoming.get(item.label);
      if (!next) return item;
      return {
        label: item.label,
        done: Boolean(next.done),
        note: next.note !== undefined ? String(next.note) : item.note,
      };
    });
  }

  await task.save();
  const populated = await populateTask(Task.findById(task._id));
  const [decorated] = await withAlerts([populated]);
  return res.json({ task: decorated });
}));

router.post('/:id/attachments', (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (error) return res.status(400).json({ message: error.message });
    return next();
  });
}, asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: 'Task not found' });
  }
  if (!req.file) return res.status(400).json({ message: 'Choose a JPEG, PNG, or PDF' });
  const task = await Task.findById(req.params.id);
  if (!task || !canAccess(req.user, task)) {
    return res.status(404).json({ message: 'Task not found' });
  }
  task.attachments.push({
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
  });
  await task.save();
  const populated = await populateTask(Task.findById(task._id));
  const [decorated] = await withAlerts([populated]);
  return res.status(201).json({ task: decorated });
}));

export default router;

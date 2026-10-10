import { Router } from 'express';
import mongoose from 'mongoose';
import { Equipment } from '../models/Equipment.js';
import { Task } from '../models/Task.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async.js';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(async (_req, res) => {
  const equipment = await Equipment.find().sort({ location: 1, name: 1 }).populate('serviceHistory.technician', 'name');
  res.json({ equipment });
}));

router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const { name, category, location, serial, status, notes } = req.body;
  if (!name || !category || !location || !serial) {
    return res.status(400).json({ message: 'Name, category, location, and serial are required' });
  }
  const equipment = await Equipment.create({
    name: String(name).trim(),
    category: String(category).trim(),
    location: String(location).trim(),
    serial: String(serial).trim(),
    status: ['operational', 'attention', 'offline'].includes(status) ? status : 'operational',
    notes: notes ? String(notes) : '',
  });
  res.status(201).json({ equipment });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: 'Equipment not found' });
  }
  const equipment = await Equipment.findById(req.params.id)
    .populate('serviceHistory.technician', 'name')
    .populate('serviceHistory.task', 'title');
  if (!equipment) return res.status(404).json({ message: 'Equipment not found' });
  res.json({ equipment });
}));

router.patch('/:id', requireAdmin, asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: 'Equipment not found' });
  }
  const equipment = await Equipment.findById(req.params.id);
  if (!equipment) return res.status(404).json({ message: 'Equipment not found' });
  const { status, notes, location } = req.body;
  if (status !== undefined) {
    if (!['operational', 'attention', 'offline'].includes(status)) {
      return res.status(400).json({ message: 'Status must be operational, attention, or offline' });
    }
    equipment.status = status;
  }
  if (notes !== undefined) equipment.notes = String(notes);
  if (location !== undefined) equipment.location = String(location).trim();
  await equipment.save();
  res.json({ equipment });
}));

router.post('/:id/history', requireAdmin, asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: 'Equipment not found' });
  }
  const equipment = await Equipment.findById(req.params.id);
  if (!equipment) return res.status(404).json({ message: 'Equipment not found' });
  const { serviceType, notes, date, taskId } = req.body;
  if (!serviceType || !String(serviceType).trim()) {
    return res.status(400).json({ message: 'Describe the service' });
  }
  let task = null;
  if (taskId) {
    if (!mongoose.isValidObjectId(taskId)) return res.status(400).json({ message: 'Unknown task' });
    task = await Task.findById(taskId);
    if (!task) return res.status(400).json({ message: 'Unknown task' });
  }
  const when = date ? new Date(date) : new Date();
  if (Number.isNaN(when.getTime())) return res.status(400).json({ message: 'Service date is not valid' });
  equipment.serviceHistory.push({
    date: when,
    serviceType: String(serviceType).trim(),
    notes: notes ? String(notes) : '',
    technician: req.user.id,
    task: task?._id || null,
  });
  await equipment.save();
  const fresh = await Equipment.findById(equipment._id)
    .populate('serviceHistory.technician', 'name')
    .populate('serviceHistory.task', 'title');
  res.status(201).json({ equipment: fresh });
}));

export default router;

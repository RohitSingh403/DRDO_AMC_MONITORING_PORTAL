import { Router } from 'express';
import { TaskTemplate } from '../models/TaskTemplate.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(async (_req, res) => {
  const templates = await TaskTemplate.find().sort({ frequency: 1, title: 1 });
  res.json({ templates });
}));

export default router;

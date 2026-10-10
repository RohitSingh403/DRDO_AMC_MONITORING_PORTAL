import { Router } from 'express';
import { User } from '../models/User.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/', asyncHandler(async (_req, res) => {
  const users = await User.find().sort({ role: 1, name: 1 });
  res.json({ users: users.map((user) => user.toPublic()) });
}));

export default router;

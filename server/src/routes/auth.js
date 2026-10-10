import { Router } from 'express';
import { User } from '../models/User.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async.js';

const router = Router();

router.post('/login', asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Email or password is incorrect' });
  }

  return res.json({ token: signToken(user), user: user.toPublic() });
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ message: 'Session expired' });
  return res.json({ user: user.toPublic() });
}));

export default router;

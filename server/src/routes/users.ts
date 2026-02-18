import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getAllUsers, findUserById } from '../services/db';

const router = Router();

router.get('/', authMiddleware as any, (_req: AuthRequest, res) => {
  const users = getAllUsers();
  res.json({ users });
});

router.get('/:id', authMiddleware as any, (req: AuthRequest, res) => {
  const user = findUserById(req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user });
});

export default router;

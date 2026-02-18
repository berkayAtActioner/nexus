import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// These endpoints proxy to the Electron app's SQLite DB via fetch.
// In a full implementation, the server would manage its own session state.
// For now, these serve as API contracts for the multi-user flow.

router.post('/:id/invite', authMiddleware as any, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'userId required' });
    return;
  }
  // Return success — actual participant management happens via Electron IPC
  res.json({ success: true, sessionId: id, userId, role: 'member' });
});

router.delete('/:id/participants/:userId', authMiddleware as any, async (req: AuthRequest, res) => {
  const { id, userId } = req.params;
  res.json({ success: true, sessionId: id, userId });
});

router.get('/:id/participants', authMiddleware as any, async (req: AuthRequest, res) => {
  const { id } = req.params;
  // Return empty — participants are managed locally via SQLite
  res.json({ participants: [] });
});

export default router;

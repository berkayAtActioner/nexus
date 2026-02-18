import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { isStreamConfigured, createStreamChannel } from '../services/stream-service';

const router = Router();

router.post('/', authMiddleware as any, async (req: AuthRequest, res) => {
  if (!isStreamConfigured()) {
    res.status(503).json({ error: 'Stream not configured' });
    return;
  }

  const { name, members, type = 'team' } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Channel name required' });
    return;
  }

  try {
    const channelId = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    const allMembers = members ? [...new Set([req.userId!, ...members])] : [req.userId!];

    const channel = await createStreamChannel(type, channelId, req.userId!, {
      name,
      members: allMembers,
    });

    res.json({ channel: { id: channelId, name, type, members: allMembers } });
  } catch (err: any) {
    console.error('Create channel error:', err);
    res.status(500).json({ error: err.message || 'Failed to create channel' });
  }
});

export default router;

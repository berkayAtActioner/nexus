import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { isStreamConfigured, getStreamClient } from '../services/stream-service';

const router = Router();

// Create a channel (server-side with admin privileges)
router.post('/', authMiddleware as any, async (req: AuthRequest, res) => {
  if (!isStreamConfigured()) {
    res.status(503).json({ error: 'Stream not configured' });
    return;
  }

  const { name, members, isPublic = true } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Channel name required' });
    return;
  }

  try {
    const client = getStreamClient();
    const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    const channelId = `${slug}-${Date.now().toString(36)}`;
    const allMembers = members ? [...new Set([req.userId!, ...members])] : [req.userId!];

    const channel = client.channel('team', channelId, {
      name,
      members: allMembers,
      isPublic,
      created_by_id: req.userId!,
    });
    await channel.create();

    res.json({ channel: { id: channelId, name, type: 'team', members: allMembers, isPublic } });
  } catch (err: any) {
    console.error('Create channel error:', err);
    res.status(500).json({ error: err.message || 'Failed to create channel' });
  }
});

// List public channels (server-side admin query — clients can't see channels they haven't joined)
router.get('/public', authMiddleware as any, async (req: AuthRequest, res) => {
  if (!isStreamConfigured()) {
    res.status(503).json({ error: 'Stream not configured' });
    return;
  }

  try {
    const client = getStreamClient();
    const channels = await client.queryChannels(
      { type: 'team' },
      [{ last_message_at: -1 }],
      { limit: 50 }
    );

    // Filter to public channels the requesting user is NOT a member of
    const publicChannels = channels
      .filter(c => {
        const data = c.data as any;
        if (!data?.isPublic) return false;
        const memberIds = Object.keys(c.state?.members || {});
        return !memberIds.includes(req.userId!);
      })
      .map(c => ({
        id: c.id,
        name: (c.data as any)?.name || c.id,
        memberCount: Object.keys(c.state?.members || {}).length,
      }));

    res.json({ channels: publicChannels });
  } catch (err: any) {
    console.error('List public channels error:', err);
    res.status(500).json({ error: err.message || 'Failed to list channels' });
  }
});

// Join a public channel (server adds user as member with admin privileges)
router.post('/join', authMiddleware as any, async (req: AuthRequest, res) => {
  if (!isStreamConfigured()) {
    res.status(503).json({ error: 'Stream not configured' });
    return;
  }

  const { channelId } = req.body;
  if (!channelId) {
    res.status(400).json({ error: 'channelId required' });
    return;
  }

  try {
    const client = getStreamClient();
    const channel = client.channel('team', channelId);
    await channel.addMembers([req.userId!]);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Join channel error:', err);
    res.status(500).json({ error: err.message || 'Failed to join channel' });
  }
});

export default router;

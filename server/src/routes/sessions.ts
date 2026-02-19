import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { isStreamConfigured, getStreamClient } from '../services/stream-service';

const router = Router();

// Share a local session — creates a Stream channel and pushes existing messages
router.post('/share', authMiddleware as any, async (req: AuthRequest, res) => {
  if (!isStreamConfigured()) {
    res.status(503).json({ error: 'Stream not configured' });
    return;
  }

  const { sessionId, agentId, title, memberIds, messages } = req.body;
  if (!sessionId || !agentId || !memberIds?.length) {
    res.status(400).json({ error: 'sessionId, agentId, and memberIds are required' });
    return;
  }

  try {
    const client = getStreamClient();
    const channelId = `ai-session-${sessionId}`;
    const allMembers = [...new Set([req.userId!, ...memberIds])];

    const channel = client.channel('messaging', channelId, {
      name: title || 'Shared Session',
      members: allMembers,
      created_by_id: req.userId!,
      agentId,
      sessionId,
    } as any);
    await channel.create();

    // Push existing messages into the channel as history
    if (messages?.length) {
      for (const msg of messages) {
        await channel.sendMessage({
          text: msg.content || '',
          user_id: req.userId!,
          role: msg.role || 'user',
          tool_calls: msg.tool_calls || '',
          mcp_app_data: msg.mcp_app_data || '',
          sender_name: msg.sender_name || '',
          original_created_at: msg.created_at || '',
        } as any);
      }
    }

    res.json({ success: true, channelId });
  } catch (err: any) {
    console.error('Share session error:', err);
    res.status(500).json({ error: err.message || 'Failed to share session' });
  }
});

// Unshare — remove a user from a shared session channel
router.post('/unshare', authMiddleware as any, async (req: AuthRequest, res) => {
  if (!isStreamConfigured()) {
    res.status(503).json({ error: 'Stream not configured' });
    return;
  }

  const { sessionId, userId } = req.body;
  if (!sessionId || !userId) {
    res.status(400).json({ error: 'sessionId and userId are required' });
    return;
  }

  try {
    const client = getStreamClient();
    const channelId = `ai-session-${sessionId}`;
    const channel = client.channel('messaging', channelId);
    await channel.removeMembers([userId]);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Unshare session error:', err);
    res.status(500).json({ error: err.message || 'Failed to unshare session' });
  }
});

// Legacy stubs kept for backward compat
router.post('/:id/invite', authMiddleware as any, async (req: AuthRequest, res) => {
  res.json({ success: true, sessionId: req.params.id, userId: req.body.userId, role: 'member' });
});

router.delete('/:id/participants/:userId', authMiddleware as any, async (req: AuthRequest, res) => {
  res.json({ success: true, sessionId: req.params.id, userId: req.params.userId });
});

router.get('/:id/participants', authMiddleware as any, async (_req: AuthRequest, res) => {
  res.json({ participants: [] });
});

export default router;

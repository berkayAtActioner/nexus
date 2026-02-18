import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { generateJwt, generateRefreshToken, authMiddleware, AuthRequest } from '../middleware/auth';
import { isStreamConfigured, generateStreamToken, upsertStreamUser } from '../services/stream-service';
import { findUserById } from '../services/db';

const router = Router();

function handleOAuthCallback(req: any, res: any): void {
  const user = req.user as any;
  if (!user) {
    res.redirect('nexus://auth-callback?error=auth_failed');
    return;
  }

  const accessToken = generateJwt(user.id);
  const refreshToken = generateRefreshToken(user.id);

  let streamToken = '';
  if (isStreamConfigured()) {
    try {
      streamToken = generateStreamToken(user.id);
      upsertStreamUser({ id: user.id, name: user.name, image: user.avatar_url || undefined }).catch(console.error);
    } catch (err) {
      console.error('Stream token generation failed:', err);
    }
  }

  const params = new URLSearchParams({
    token: accessToken,
    refreshToken,
    streamToken,
    userId: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar_url || '',
  });

  res.redirect(`nexus://auth-callback?${params.toString()}`);
}

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: 'nexus://auth-callback?error=google_failed' }), handleOAuthCallback);

// GitHub OAuth
router.get('/github', passport.authenticate('github', { scope: ['user:email'], session: false }));
router.get('/github/callback', passport.authenticate('github', { session: false, failureRedirect: 'nexus://auth-callback?error=github_failed' }), handleOAuthCallback);

// Refresh token
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token required' });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as { userId: string; type?: string };
    if (decoded.type !== 'refresh') {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const user = findUserById(decoded.userId);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const newAccessToken = generateJwt(user.id);
    let streamToken = '';
    if (isStreamConfigured()) {
      try { streamToken = generateStreamToken(user.id); } catch {}
    }

    res.json({ token: newAccessToken, streamToken });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Get current user
router.get('/me', authMiddleware as any, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

// Logout (client-side token removal)
router.post('/logout', authMiddleware as any, (_req: AuthRequest, res) => {
  res.json({ success: true });
});

// Dev login — creates a local user with real JWT + Stream token (dev only)
router.post('/dev-login', async (req, res) => {
  const { upsertUser } = await import('../services/db');
  const { v4: uuidv4 } = await import('uuid');

  const userId = req.body?.userId || 'local-user-1';
  const name = req.body?.name || 'Local User';
  const email = req.body?.email || `${userId}@nexus.app`;

  const user = upsertUser({
    id: userId,
    email,
    name,
    avatar_url: null,
    provider: 'local',
    provider_id: userId,
  });

  const accessToken = generateJwt(user.id);
  const refreshToken = generateRefreshToken(user.id);

  let streamToken = '';
  if (isStreamConfigured()) {
    try {
      streamToken = generateStreamToken(user.id);
      await upsertStreamUser({ id: user.id, name: user.name });
    } catch (err) {
      console.error('Stream token generation failed:', err);
    }
  }

  res.json({
    token: accessToken,
    refreshToken,
    streamToken,
    userId: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar_url || '',
  });
});

export default router;

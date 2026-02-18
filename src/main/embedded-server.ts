import express from 'express';
import cors from 'cors';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { v4 as uuidv4 } from 'uuid';
import { StreamChat } from 'stream-chat';
import Database from 'better-sqlite3';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { app as electronApp } from 'electron';

// ── Config ──────────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || 'nexus-dev-jwt-secret-change-in-production';
const STREAM_API_KEY = process.env.STREAM_API_KEY || '';
const STREAM_API_SECRET = process.env.STREAM_API_SECRET || '';
const PORT = parseInt(process.env.PORT || '3001', 10);

// ── Server DB ───────────────────────────────────────────────────────────────

interface ServerUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  provider: string;
  provider_id: string | null;
  created_at: string;
}

let serverDb: Database.Database;

function initServerDb(): void {
  const dbDir = path.join(electronApp.getPath('userData'), 'server-data');
  fs.mkdirSync(dbDir, { recursive: true });
  const dbPath = path.join(dbDir, 'nexus-server.db');
  serverDb = new Database(dbPath);
  serverDb.pragma('journal_mode = WAL');
  serverDb.pragma('foreign_keys = ON');
  serverDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      avatar_url TEXT,
      provider TEXT NOT NULL,
      provider_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function findUserById(id: string): ServerUser | undefined {
  return serverDb.prepare('SELECT * FROM users WHERE id = ?').get(id) as ServerUser | undefined;
}

function findUserByProviderId(provider: string, providerId: string): ServerUser | undefined {
  return serverDb.prepare('SELECT * FROM users WHERE provider = ? AND provider_id = ?').get(provider, providerId) as ServerUser | undefined;
}

function upsertUser(user: Omit<ServerUser, 'created_at'>): ServerUser {
  const existing = findUserByProviderId(user.provider, user.provider_id!);
  if (existing) {
    serverDb.prepare('UPDATE users SET name = ?, avatar_url = ?, email = ? WHERE id = ?')
      .run(user.name, user.avatar_url, user.email, existing.id);
    return findUserById(existing.id)!;
  }
  serverDb.prepare('INSERT INTO users (id, email, name, avatar_url, provider, provider_id) VALUES (?, ?, ?, ?, ?, ?)')
    .run(user.id, user.email, user.name, user.avatar_url, user.provider, user.provider_id);
  return findUserById(user.id)!;
}

function getAllUsers(): ServerUser[] {
  return serverDb.prepare('SELECT * FROM users ORDER BY name ASC').all() as ServerUser[];
}

// ── JWT helpers ─────────────────────────────────────────────────────────────

function generateJwt(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, { expiresIn: '30d' });
}

// ── Stream Chat ─────────────────────────────────────────────────────────────

let streamClient: StreamChat | null = null;

function isStreamConfigured(): boolean {
  return !!(STREAM_API_KEY && STREAM_API_SECRET &&
    STREAM_API_KEY !== 'your-stream-api-key' && STREAM_API_SECRET !== 'your-stream-api-secret');
}

function getStreamClient(): StreamChat {
  if (!streamClient) {
    if (!isStreamConfigured()) throw new Error('Stream not configured');
    streamClient = StreamChat.getInstance(STREAM_API_KEY, STREAM_API_SECRET);
  }
  return streamClient;
}

function generateStreamToken(userId: string): string {
  return getStreamClient().createToken(userId);
}

async function upsertStreamUser(user: { id: string; name: string; image?: string }): Promise<void> {
  const client = getStreamClient();
  await client.upsertUser({ id: user.id, name: user.name, image: user.image });
}

// ── Agent config ────────────────────────────────────────────────────────────

interface AgentConfig {
  id: string; name: string; role: string; avatar: string; color: string;
  isGeneral: boolean; model: string; systemPrompt: string;
  mcpServers: string[]; temperature: number; maxTokens: number;
}

let agentsCache: AgentConfig[] | null = null;

function loadAgents(): AgentConfig[] {
  if (agentsCache) return agentsCache;
  // Try multiple locations for agents.yml
  const candidates = [
    path.join(process.resourcesPath || '', 'agents.yml'),    // packaged extraResource
    path.join(__dirname, '../../server/agents.yml'),          // dev
    path.join(__dirname, '../server/agents.yml'),             // dev alt
    path.join(electronApp.getAppPath(), 'server/agents.yml'),// packaged alt
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf-8');
        const parsed = yaml.load(content) as { agents: AgentConfig[] };
        agentsCache = parsed.agents;
        return agentsCache;
      }
    } catch { /* try next */ }
  }
  // Fallback: hardcoded minimal agents
  agentsCache = [
    { id: 'nexus', name: 'Nexus', role: 'General Assistant', avatar: '✦', color: '#8b5cf6', isGeneral: true, model: 'claude-sonnet-4-20250514', systemPrompt: 'You are Nexus, a helpful AI assistant.', mcpServers: [], temperature: 0.7, maxTokens: 4096 },
    { id: 'atlas', name: 'Atlas', role: 'Research & Analysis', avatar: '◈', color: '#6366f1', isGeneral: false, model: 'claude-sonnet-4-20250514', systemPrompt: 'You are Atlas, a research specialist.', mcpServers: [], temperature: 0.5, maxTokens: 8192 },
    { id: 'muse', name: 'Muse', role: 'Writing & Creative', avatar: '◎', color: '#ec4899', isGeneral: false, model: 'claude-sonnet-4-20250514', systemPrompt: 'You are Muse, a writing specialist.', mcpServers: [], temperature: 0.8, maxTokens: 4096 },
    { id: 'forge', name: 'Forge', role: 'Code & Engineering', avatar: '⬡', color: '#f59e0b', isGeneral: false, model: 'claude-sonnet-4-20250514', systemPrompt: 'You are Forge, a code specialist.', mcpServers: [], temperature: 0.3, maxTokens: 8192 },
  ];
  return agentsCache;
}

// ── Auth middleware ──────────────────────────────────────────────────────────

function authMiddleware(req: any, res: any, next: any): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }
  try {
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET) as { userId: string };
    const user = findUserById(decoded.userId);
    if (!user) { res.status(401).json({ error: 'User not found' }); return; }
    req.user = user;
    req.userId = user.id;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ── OAuth callback helper ───────────────────────────────────────────────────

function handleOAuthCallback(req: any, res: any): void {
  const user = req.user;
  if (!user) { res.redirect('nexus://auth-callback?error=auth_failed'); return; }
  const accessToken = generateJwt(user.id);
  const refreshToken = generateRefreshToken(user.id);
  let streamToken = '';
  if (isStreamConfigured()) {
    try {
      streamToken = generateStreamToken(user.id);
      upsertStreamUser({ id: user.id, name: user.name, image: user.avatar_url || undefined }).catch(console.error);
    } catch (err) { console.error('Stream token generation failed:', err); }
  }
  const params = new URLSearchParams({
    token: accessToken, refreshToken, streamToken,
    userId: user.id, name: user.name, email: user.email, avatar: user.avatar_url || '',
  });
  res.redirect(`nexus://auth-callback?${params.toString()}`);
}

// ── Build & start Express ───────────────────────────────────────────────────

let server: any = null;

export function startEmbeddedServer(): void {
  // Load .env — check extraResource (packaged) and server dir (dev)
  const envCandidates = [
    path.join(process.resourcesPath || '', '.env'),      // packaged extraResource
    path.join(__dirname, '../../server/.env'),            // dev
  ];
  for (const envPath of envCandidates) {
    try {
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        for (const line of envContent.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            const value = trimmed.slice(eqIdx + 1).trim();
            if (!process.env[key]) process.env[key] = value;
          }
        }
        console.log(`[Nexus Embedded Server] Loaded .env from ${envPath}`);
        break;
      }
    } catch { /* try next */ }
  }

  // Re-read env after loading .env
  const jwtSecret = process.env.JWT_SECRET || JWT_SECRET;
  // Patch the module-level refs won't work for consts, so we use process.env directly in functions
  // JWT_SECRET is used via the functions that read it at call time

  initServerDb();

  // Configure passport
  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser((id: string, done) => done(null, findUserById(id) || null));

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id') {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.CALLBACK_URL || 'http://localhost:3001'}/api/auth/google/callback`,
    }, (_a, _r, profile, done) => {
      try {
        const user = upsertUser({
          id: uuidv4(), email: profile.emails?.[0]?.value || `${profile.id}@google.oauth`,
          name: profile.displayName || 'Google User', avatar_url: profile.photos?.[0]?.value || null,
          provider: 'google', provider_id: profile.id,
        });
        done(null, user);
      } catch (err) { done(err as Error); }
    }));
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_ID !== 'your-github-client-id') {
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: `${process.env.CALLBACK_URL || 'http://localhost:3001'}/api/auth/github/callback`,
    }, (_a: string, _r: string, profile: any, done: any) => {
      try {
        const user = upsertUser({
          id: uuidv4(), email: profile.emails?.[0]?.value || `${profile.id}@github.oauth`,
          name: profile.displayName || profile.username || 'GitHub User',
          avatar_url: profile.photos?.[0]?.value || null,
          provider: 'github', provider_id: profile.id,
        });
        done(null, user);
      } catch (err) { done(err as Error); }
    }));
  }

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(passport.initialize());

  // ── Routes ──────────────────────────────────────────────────────────────

  // Health
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', version: '2.0.0' }));

  // Stream config
  app.get('/api/stream/config', (_req, res) => {
    const apiKey = process.env.STREAM_API_KEY;
    if (!apiKey || apiKey === 'your-stream-api-key') {
      res.json({ configured: false }); return;
    }
    res.json({ configured: true, apiKey });
  });

  // Agents
  app.get('/api/agents', (_req, res) => {
    const agents = loadAgents();
    const safe = agents.map(({ systemPrompt, ...rest }) => rest);
    res.json(safe);
  });

  app.get('/api/agents/:id', (req, res) => {
    const agent = loadAgents().find(a => a.id === req.params.id);
    if (!agent) { res.status(404).json({ error: 'Agent not found' }); return; }
    if (req.query.full === 'true') { res.json(agent); return; }
    const { systemPrompt, ...safe } = agent;
    res.json(safe);
  });

  // Auth — OAuth
  app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
  app.get('/api/auth/google/callback', passport.authenticate('google', { session: false, failureRedirect: 'nexus://auth-callback?error=google_failed' }), handleOAuthCallback);
  app.get('/api/auth/github', passport.authenticate('github', { scope: ['user:email'], session: false }));
  app.get('/api/auth/github/callback', passport.authenticate('github', { session: false, failureRedirect: 'nexus://auth-callback?error=github_failed' }), handleOAuthCallback);

  // Auth — Refresh
  app.post('/api/auth/refresh', (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) { res.status(400).json({ error: 'Refresh token required' }); return; }
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || JWT_SECRET) as { userId: string; type?: string };
      if (decoded.type !== 'refresh') { res.status(401).json({ error: 'Invalid refresh token' }); return; }
      const user = findUserById(decoded.userId);
      if (!user) { res.status(401).json({ error: 'User not found' }); return; }
      const newAccessToken = generateJwt(user.id);
      let streamToken = '';
      if (isStreamConfigured()) { try { streamToken = generateStreamToken(user.id); } catch {} }
      res.json({ token: newAccessToken, streamToken });
    } catch { res.status(401).json({ error: 'Invalid refresh token' }); }
  });

  // Auth — Me / Logout
  app.get('/api/auth/me', authMiddleware, (req: any, res) => res.json({ user: req.user }));
  app.post('/api/auth/logout', authMiddleware, (_req, res) => res.json({ success: true }));

  // Auth — Dev login
  app.post('/api/auth/dev-login', async (req, res) => {
    const userId = req.body?.userId || 'local-user-1';
    const name = req.body?.name || 'Local User';
    const email = req.body?.email || `${userId}@nexus.app`;
    const user = upsertUser({ id: userId, email, name, avatar_url: null, provider: 'local', provider_id: userId });
    const accessToken = generateJwt(user.id);
    const refreshToken = generateRefreshToken(user.id);
    let streamToken = '';
    if (isStreamConfigured()) {
      try { streamToken = generateStreamToken(user.id); await upsertStreamUser({ id: user.id, name: user.name }); }
      catch (err) { console.error('Stream token generation failed:', err); }
    }
    res.json({ token: accessToken, refreshToken, streamToken, userId: user.id, name: user.name, email: user.email, avatar: user.avatar_url || '' });
  });

  // Users
  app.get('/api/users', authMiddleware, (_req, res) => res.json({ users: getAllUsers() }));
  app.get('/api/users/:id', authMiddleware, (req: any, res) => {
    const user = findUserById(req.params.id);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ user });
  });

  // Channels
  app.post('/api/channels', authMiddleware, async (req: any, res) => {
    if (!isStreamConfigured()) { res.status(503).json({ error: 'Stream not configured' }); return; }
    const { name, members, type = 'team' } = req.body;
    if (!name) { res.status(400).json({ error: 'Channel name required' }); return; }
    try {
      const channelId = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
      const allMembers = members ? [...new Set([req.userId!, ...members])] : [req.userId!];
      const client = getStreamClient();
      const channel = client.channel(type, channelId, { name, members: allMembers, created_by_id: req.userId } as any);
      await channel.create();
      res.json({ channel: { id: channelId, name, type, members: allMembers } });
    } catch (err: any) { res.status(500).json({ error: err.message || 'Failed to create channel' }); }
  });

  // Sessions (proxy stubs)
  app.post('/api/sessions/:id/invite', authMiddleware, (req: any, res) => {
    res.json({ success: true, sessionId: req.params.id, userId: req.body.userId, role: 'member' });
  });
  app.delete('/api/sessions/:id/participants/:userId', authMiddleware, (req: any, res) => {
    res.json({ success: true, sessionId: req.params.id, userId: req.params.userId });
  });
  app.get('/api/sessions/:id/participants', authMiddleware, (_req, res) => {
    res.json({ participants: [] });
  });

  // ── Start ─────────────────────────────────────────────────────────────────

  server = app.listen(PORT, () => {
    console.log(`[Nexus Embedded Server] Running on http://localhost:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[Nexus Embedded Server] Port ${PORT} already in use — external server may be running`);
    } else {
      console.error('[Nexus Embedded Server] Failed to start:', err);
    }
  });
}

export function stopEmbeddedServer(): void {
  if (server) {
    server.close();
    server = null;
  }
}

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { initServerDb } from './services/db';
import { configurePassport } from './services/passport-config';
import agentsRouter from './routes/agents';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import channelsRouter from './routes/channels';
import sessionsRouter from './routes/sessions';

// Initialize database
initServerDb();

// Configure passport
configurePassport();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Routes
app.use('/api/agents', agentsRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/channels', channelsRouter);
app.use('/api/sessions', sessionsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '2.0.0' });
});

// Stream config endpoint (public — returns API key only, not secret)
app.get('/api/stream/config', (_req, res) => {
  const apiKey = process.env.STREAM_API_KEY;
  if (!apiKey || apiKey === 'your-stream-api-key') {
    res.json({ configured: false });
    return;
  }
  res.json({ configured: true, apiKey });
});

app.listen(PORT, () => {
  console.log(`[Nexus Server] Running on http://localhost:${PORT}`);
});

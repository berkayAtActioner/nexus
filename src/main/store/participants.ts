import { getDb } from './db';

export interface DbParticipant {
  session_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

export function getParticipants(sessionId: string): DbParticipant[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM session_participants WHERE session_id = ? ORDER BY joined_at ASC'
  ).all(sessionId) as DbParticipant[];
}

export function addParticipant(sessionId: string, userId: string, role = 'member'): DbParticipant {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT OR IGNORE INTO session_participants (session_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)'
  ).run(sessionId, userId, role, now);
  return { session_id: sessionId, user_id: userId, role, joined_at: now };
}

export function removeParticipant(sessionId: string, userId: string): void {
  const db = getDb();
  db.prepare('DELETE FROM session_participants WHERE session_id = ? AND user_id = ?').run(sessionId, userId);
}

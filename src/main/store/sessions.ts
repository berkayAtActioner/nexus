import { getDb } from './db';
import { v4 as uuidv4 } from 'uuid';

export interface DbSession {
  id: string;
  user_id: string;
  agent_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface DbMessage {
  id: string;
  session_id: string;
  role: string;
  sender_name: string | null;
  content: string;
  mcp_app_data: string | null;
  attachments: string | null;
  tool_calls: string | null;
  created_at: string;
}

const DEFAULT_USER = 'local-user-1';

export function getSessions(agentId: string, userId?: string): DbSession[] {
  const db = getDb();
  const uid = userId || DEFAULT_USER;
  return db.prepare(
    'SELECT * FROM chat_sessions WHERE user_id = ? AND agent_id = ? ORDER BY updated_at DESC'
  ).all(uid, agentId) as DbSession[];
}

export function createSession(agentId: string, title: string, userId?: string): DbSession {
  const db = getDb();
  const uid = userId || DEFAULT_USER;
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO chat_sessions (id, user_id, agent_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, uid, agentId, title, now, now);
  return { id, user_id: uid, agent_id: agentId, title, created_at: now, updated_at: now };
}

export function getMessages(sessionId: string): DbMessage[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC'
  ).all(sessionId) as DbMessage[];
}

export function saveMessage(msg: {
  id: string;
  session_id: string;
  role: string;
  sender_name?: string;
  content: string;
  mcp_app_data?: string;
  tool_calls?: string;
}): DbMessage {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO messages (id, session_id, role, sender_name, content, mcp_app_data, tool_calls, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(msg.id, msg.session_id, msg.role, msg.sender_name || null, msg.content, msg.mcp_app_data || null, msg.tool_calls || null, now);

  // Update session updated_at
  db.prepare('UPDATE chat_sessions SET updated_at = ? WHERE id = ?').run(now, msg.session_id);

  return {
    id: msg.id,
    session_id: msg.session_id,
    role: msg.role,
    sender_name: msg.sender_name || null,
    content: msg.content,
    mcp_app_data: msg.mcp_app_data || null,
    attachments: null,
    tool_calls: msg.tool_calls || null,
    created_at: now,
  };
}

export function deleteSession(sessionId: string): void {
  const db = getDb();
  db.prepare('DELETE FROM session_participants WHERE session_id = ?').run(sessionId);
  db.prepare('DELETE FROM messages WHERE session_id = ?').run(sessionId);
  db.prepare('DELETE FROM chat_sessions WHERE id = ?').run(sessionId);
}

export function updateSessionTitle(sessionId: string, title: string): void {
  const db = getDb();
  db.prepare('UPDATE chat_sessions SET title = ?, updated_at = ? WHERE id = ?')
    .run(title, new Date().toISOString(), sessionId);
}

import { getDb } from './db';

export interface DbCopilotMessage {
  id: string;
  user_id: string;
  agent_id: string;
  context_type: string;
  context_id: string;
  role: string;
  content: string;
  created_at: string;
}

export function getCopilotMessages(agentId: string, contextType: string, contextId: string): DbCopilotMessage[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM copilot_messages WHERE agent_id = ? AND context_type = ? AND context_id = ? ORDER BY created_at ASC'
  ).all(agentId, contextType, contextId) as DbCopilotMessage[];
}

export function saveCopilotMessage(msg: {
  id: string;
  user_id: string;
  agent_id: string;
  context_type: string;
  context_id: string;
  role: string;
  content: string;
}): DbCopilotMessage {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO copilot_messages (id, user_id, agent_id, context_type, context_id, role, content, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(msg.id, msg.user_id, msg.agent_id, msg.context_type, msg.context_id, msg.role, msg.content, now);
  return { ...msg, created_at: now };
}

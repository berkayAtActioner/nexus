import { getDb } from './db';
import { McpServerConfig } from '../../shared/types';

interface McpServerRow {
  id: string;
  name: string;
  icon: string;
  description: string;
  transport: string;
  command: string | null;
  args: string | null;
  env: string | null;
  url: string | null;
  headers: string | null;
  category: string;
  auth_type: string | null;
  oauth_client_id: string | null;
  oauth_client_secret: string | null;
  oauth_scope: string | null;
}

function rowToConfig(row: McpServerRow): McpServerConfig {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon || '',
    description: row.description || '',
    transport: row.transport as McpServerConfig['transport'],
    command: row.command || undefined,
    args: row.args ? JSON.parse(row.args) : undefined,
    env: row.env ? JSON.parse(row.env) : undefined,
    url: row.url || undefined,
    headers: row.headers ? JSON.parse(row.headers) : undefined,
    category: row.category || 'custom',
    isUserDefined: true,
    authType: (row.auth_type as McpServerConfig['authType']) || 'none',
    oauthClientId: row.oauth_client_id || undefined,
    oauthClientSecret: row.oauth_client_secret || undefined,
    oauthScope: row.oauth_scope || undefined,
  };
}

export function getUserMcpServers(): McpServerConfig[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM user_mcp_servers ORDER BY created_at ASC').all() as McpServerRow[];
  return rows.map(rowToConfig);
}

export function saveUserMcpServer(config: McpServerConfig): void {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO user_mcp_servers (id, name, icon, description, transport, command, args, env, url, headers, category, auth_type, oauth_client_id, oauth_client_secret, oauth_scope)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    config.id,
    config.name,
    config.icon || '',
    config.description || '',
    config.transport,
    config.command || null,
    config.args ? JSON.stringify(config.args) : null,
    config.env ? JSON.stringify(config.env) : null,
    config.url || null,
    config.headers ? JSON.stringify(config.headers) : null,
    config.category || 'custom',
    config.authType || 'none',
    config.oauthClientId || null,
    config.oauthClientSecret || null,
    config.oauthScope || null,
  );
}

export function deleteUserMcpServer(serverId: string): void {
  const db = getDb();
  db.prepare('DELETE FROM user_mcp_servers WHERE id = ?').run(serverId);
  // Also remove any agent bindings for this server
  db.prepare('DELETE FROM agent_mcp_bindings WHERE server_id = ?').run(serverId);
}

// Agent MCP binding CRUD
export function getAgentMcpBindings(agentId: string): string[] {
  const db = getDb();
  const rows = db.prepare('SELECT server_id FROM agent_mcp_bindings WHERE agent_id = ?').all(agentId) as { server_id: string }[];
  return rows.map(r => r.server_id);
}

export function addAgentMcpBinding(agentId: string, serverId: string): void {
  const db = getDb();
  db.prepare('INSERT OR IGNORE INTO agent_mcp_bindings (agent_id, server_id) VALUES (?, ?)').run(agentId, serverId);
}

export function removeAgentMcpBinding(agentId: string, serverId: string): void {
  const db = getDb();
  db.prepare('DELETE FROM agent_mcp_bindings WHERE agent_id = ? AND server_id = ?').run(agentId, serverId);
}

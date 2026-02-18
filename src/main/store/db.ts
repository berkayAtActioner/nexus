import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

export function initDb(): void {
  const dbPath = path.join(app.getPath('userData'), 'nexus.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      avatar_url TEXT,
      provider TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      sender_name TEXT,
      content TEXT NOT NULL,
      mcp_app_data TEXT,
      attachments TEXT,
      tool_calls TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      theme TEXT DEFAULT 'light',
      sidebar_width INTEGER DEFAULT 232,
      api_key TEXT,
      pinned_app_order TEXT,
      last_active_view TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS session_participants (
      session_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (session_id, user_id),
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
    );

    CREATE TABLE IF NOT EXISTS user_mcp_servers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '',
      description TEXT DEFAULT '',
      transport TEXT NOT NULL,
      command TEXT,
      args TEXT,
      env TEXT,
      url TEXT,
      headers TEXT,
      category TEXT DEFAULT 'custom',
      auth_type TEXT DEFAULT 'none',
      oauth_client_id TEXT,
      oauth_client_secret TEXT,
      oauth_scope TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS copilot_messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      context_type TEXT NOT NULL,
      context_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS agent_mcp_bindings (
      agent_id TEXT NOT NULL,
      server_id TEXT NOT NULL,
      PRIMARY KEY (agent_id, server_id)
    );
  `);

  // Migrate: add OAuth columns to user_mcp_servers if missing
  const mcpCols = db.prepare("PRAGMA table_info(user_mcp_servers)").all() as { name: string }[];
  const colNames = new Set(mcpCols.map(c => c.name));
  if (!colNames.has('auth_type')) {
    db.exec("ALTER TABLE user_mcp_servers ADD COLUMN auth_type TEXT DEFAULT 'none'");
    db.exec("ALTER TABLE user_mcp_servers ADD COLUMN oauth_client_id TEXT");
    db.exec("ALTER TABLE user_mcp_servers ADD COLUMN oauth_client_secret TEXT");
    db.exec("ALTER TABLE user_mcp_servers ADD COLUMN oauth_scope TEXT");
  }

  // Insert hardcoded local user if not exists (backward compat for dev)
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get('local-user-1');
  if (!existing) {
    db.prepare(
      'INSERT INTO users (id, email, name, avatar_url, provider, provider_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run('local-user-1', 'local@nexus.app', 'Local User', null, 'local', 'local-1');
  }

  // Insert default settings if not exists
  const existingSettings = db.prepare('SELECT user_id FROM user_settings WHERE user_id = ?').get('local-user-1');
  if (!existingSettings) {
    db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').run('local-user-1');
  }
}

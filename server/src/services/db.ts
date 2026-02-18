import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database;

export interface ServerUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  provider: string;
  provider_id: string | null;
  created_at: string;
}

export function initServerDb(): void {
  const dbPath = path.join(process.cwd(), 'data', 'nexus-server.db');
  // Ensure data directory exists
  const fs = require('fs');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

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
      provider_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export function getServerDb(): Database.Database {
  if (!db) throw new Error('Server DB not initialized');
  return db;
}

export function findUserByEmail(email: string): ServerUser | undefined {
  return getServerDb().prepare('SELECT * FROM users WHERE email = ?').get(email) as ServerUser | undefined;
}

export function findUserById(id: string): ServerUser | undefined {
  return getServerDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as ServerUser | undefined;
}

export function findUserByProviderId(provider: string, providerId: string): ServerUser | undefined {
  return getServerDb().prepare(
    'SELECT * FROM users WHERE provider = ? AND provider_id = ?'
  ).get(provider, providerId) as ServerUser | undefined;
}

export function createUser(user: Omit<ServerUser, 'created_at'>): ServerUser {
  const db = getServerDb();
  db.prepare(
    'INSERT INTO users (id, email, name, avatar_url, provider, provider_id) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(user.id, user.email, user.name, user.avatar_url, user.provider, user.provider_id);
  return findUserById(user.id)!;
}

export function upsertUser(user: Omit<ServerUser, 'created_at'>): ServerUser {
  const existing = findUserByProviderId(user.provider, user.provider_id!);
  if (existing) {
    getServerDb().prepare(
      'UPDATE users SET name = ?, avatar_url = ?, email = ? WHERE id = ?'
    ).run(user.name, user.avatar_url, user.email, existing.id);
    return findUserById(existing.id)!;
  }
  return createUser(user);
}

export function getAllUsers(): ServerUser[] {
  return getServerDb().prepare('SELECT * FROM users ORDER BY name ASC').all() as ServerUser[];
}

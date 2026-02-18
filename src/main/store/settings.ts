import { getDb } from './db';

export interface DbSettings {
  user_id: string;
  theme: string;
  sidebar_width: number;
  api_key: string | null;
  pinned_app_order: string | null;
  last_active_view: string | null;
}

const DEFAULT_USER = 'local-user-1';

export function getSettings(userId?: string): DbSettings {
  const db = getDb();
  const uid = userId || DEFAULT_USER;
  const row = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(uid) as DbSettings | undefined;
  if (row) return row;

  // If no settings exist for this user, create defaults
  try {
    db.prepare('INSERT OR IGNORE INTO user_settings (user_id) VALUES (?)').run(uid);
  } catch {}

  return {
    user_id: uid,
    theme: 'light',
    sidebar_width: 232,
    api_key: null,
    pinned_app_order: null,
    last_active_view: null,
  };
}

export function updateSettings(updates: Partial<Omit<DbSettings, 'user_id'>>, userId?: string): DbSettings {
  const db = getDb();
  const uid = userId || DEFAULT_USER;

  // Ensure settings row exists
  getSettings(uid);

  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (key !== 'user_id') {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length > 0) {
    values.push(uid);
    db.prepare(`UPDATE user_settings SET ${fields.join(', ')} WHERE user_id = ?`).run(...values);
  }

  return getSettings(uid);
}

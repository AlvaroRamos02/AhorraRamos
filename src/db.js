import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const dir = resolve(process.env.DATA_DIR || './data');
mkdirSync(dir, { recursive: true });
export const db = new DatabaseSync(join(dir, 'ahorra-ramos.sqlite'));

const connectionSchema = `CREATE TABLE IF NOT EXISTS ing_connection (
  id INTEGER PRIMARY KEY CHECK(id=1),
  provider_session_id TEXT NOT NULL UNIQUE, provider_account_id TEXT NOT NULL,
  connected_at TEXT NOT NULL, last_sync_at TEXT, last_sync_error TEXT, snapshot TEXT
)`;

db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS user (id INTEGER PRIMARY KEY CHECK(id=1), salt TEXT NOT NULL, password_hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS session (token_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS expense_category_override (
  account_id TEXT NOT NULL,
  movement_key TEXT NOT NULL,
  category_id TEXT NOT NULL,
  PRIMARY KEY (account_id, movement_key)
);
`);

export function atomic(work) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = work();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

atomic(() => {
  const columns = db.prepare('PRAGMA table_info(ing_connection)').all();
  if (columns.some(column => column.name === 'account_id')) {
    db.exec(`ALTER TABLE ing_connection RENAME TO ing_connection_legacy;
      ${connectionSchema};
      INSERT INTO ing_connection (id, provider_session_id, provider_account_id, connected_at, last_sync_at, last_sync_error, snapshot)
      SELECT id, provider_session_id, provider_account_id, connected_at, last_sync_at, last_sync_error,
        ${columns.some(column => column.name === 'snapshot') ? 'snapshot' : 'NULL'}
      FROM ing_connection_legacy;
      DROP TABLE ing_connection_legacy;`);
  } else {
    db.exec(connectionSchema);
  }
});

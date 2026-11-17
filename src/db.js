import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const dir = resolve(process.env.DATA_DIR || './data');
mkdirSync(dir, { recursive: true });
export const db = new DatabaseSync(join(dir, 'ahorra-ramos.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS user (id INTEGER PRIMARY KEY CHECK(id=1), salt TEXT NOT NULL, password_hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS session (token_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS account (id INTEGER PRIMARY KEY, name TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('checking','savings','cash','investment')), opening_cents INTEGER NOT NULL DEFAULT 0, opening_date TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS category (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, archived INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS transaction_entry (
  id INTEGER PRIMARY KEY, type TEXT NOT NULL CHECK(type IN ('income','expense','transfer')),
  amount_cents INTEGER NOT NULL CHECK(amount_cents>0), date TEXT NOT NULL,
  account_id INTEGER NOT NULL REFERENCES account(id), destination_id INTEGER REFERENCES account(id),
  category_id INTEGER REFERENCES category(id), note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed','planned','cancelled')),
  salary_month TEXT UNIQUE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK((type='transfer' AND destination_id IS NOT NULL AND destination_id != account_id AND category_id IS NULL) OR (type!='transfer' AND destination_id IS NULL))
);
CREATE INDEX IF NOT EXISTS tx_date ON transaction_entry(date);
CREATE INDEX IF NOT EXISTS tx_account ON transaction_entry(account_id);
CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY, entity TEXT NOT NULL, entity_id INTEGER NOT NULL, action TEXT NOT NULL, snapshot TEXT NOT NULL, at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
`);
if (!db.prepare('PRAGMA table_info(account)').all().some(column => column.name === 'opening_date')) {
  db.exec("ALTER TABLE account ADD COLUMN opening_date TEXT NOT NULL DEFAULT '2026-11-15'");
}
for (const name of ['Caprichos','Pádel','Trabajo','Novia','IA','Sin categorizar']) db.prepare('INSERT OR IGNORE INTO category(name) VALUES(?)').run(name);

export function atomic(work) {
  db.exec('BEGIN IMMEDIATE');
  try { const result = work(); db.exec('COMMIT'); return result; }
  catch (error) { db.exec('ROLLBACK'); throw error; }
}

export function state(month) {
  const accounts = db.prepare('SELECT * FROM account ORDER BY id').all();
  const categories = db.prepare('SELECT * FROM category WHERE archived=0 ORDER BY id').all();
  const transactions = db.prepare(`SELECT t.*, c.name category_name, a.name account_name, d.name destination_name
    FROM transaction_entry t LEFT JOIN category c ON c.id=t.category_id
    JOIN account a ON a.id=t.account_id LEFT JOIN account d ON d.id=t.destination_id ORDER BY t.date DESC,t.id DESC`).all();
  return { accounts, categories, transactions };
}

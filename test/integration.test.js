import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { bankDashboard } from '../src/domain.js';

test('HTTP muestra solo la consulta bancaria y conserva el registro anterior', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ahorra-ramos-'));
  const path = join(dir, 'ahorra-ramos.sqlite');
  const port = 31000 + Math.floor(Math.random() * 10000);
  const origin = `http://127.0.0.1:${port}`;
  const serverPath = resolve('src/server.js');
  const env = { ...process.env, DATA_DIR: dir, PORT: String(port), LOCAL_TLS_KEY_PATH: '', LOCAL_TLS_CERT_PATH: '' };
  let child;

  const start = async () => {
    child = spawn(process.execPath, [serverPath], { env, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stderr.on('data', chunk => { output += chunk; });
    for (let i = 0; i < 100 && child.exitCode === null; i++) {
      try { if ((await fetch(origin + '/api/state')).ok) return; } catch {}
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error('El servidor no inició. ' + output);
  };

  const stop = async () => {
    if (!child || child.exitCode !== null || child.signalCode !== null) return;
    const exited = once(child, 'exit');
    child.kill();
    await exited;
  };

  const call = async (path, method = 'GET', data, requestOrigin = origin) => {
    const response = await fetch(origin + path, {
      method, headers: { Origin: requestOrigin, 'Content-Type': 'application/json' },
      body: data === undefined ? undefined : JSON.stringify(data)
    });
    return { status: response.status, value: await response.json() };
  };

  try {
    const legacy = new DatabaseSync(path);
    try {
      legacy.exec(`
        CREATE TABLE account (id INTEGER PRIMARY KEY);
        INSERT INTO account VALUES (1);
        CREATE TABLE transaction_entry (id INTEGER PRIMARY KEY, note TEXT);
        INSERT INTO transaction_entry VALUES (1, 'Movimiento manual sintético');
        CREATE TABLE ing_connection (
          id INTEGER PRIMARY KEY, account_id INTEGER NOT NULL REFERENCES account(id),
          provider_session_id TEXT NOT NULL, provider_account_id TEXT NOT NULL, connected_at TEXT NOT NULL,
          last_sync_at TEXT, last_sync_error TEXT, snapshot TEXT
        );
      `);
      legacy.prepare('INSERT INTO ing_connection VALUES (1, 1, ?, ?, ?, ?, NULL, ?)').run(
        'sesión-sintética', 'cuenta-sintética', '2026-11-01T10:00:00Z', '2026-11-10T10:00:00Z',
        JSON.stringify({ balanceCents: 1111, balanceKind: 'booked', transactions: [
          { note: 'Abono sintético', date: '2026-11-09', amountCents: 1222 },
          { note: 'Cargo sintético', date: '2026-11-08', amountCents: -111 },
          { note: 'Cargo repetido', date: '2026-11-08', amountCents: -22 },
          { note: 'Cargo repetido', date: '2026-11-08', amountCents: -22 },
          { note: 'Cargo del mes anterior', date: '2026-09-30', amountCents: -320 }
        ] })
      );
    } finally {
      legacy.close();
    }
    await start();

    const page = await fetch(origin + '/');
    const index = await page.text();
    assert.match(index, /id="movement-list"/);
    assert.match(index, /id="group-by"/);
    assert.match(index, /<a href="#comparativa">/);
    assert.match(index, /<section id="comparativa"[^>]* hidden>/);
    assert.match(index, /id="monthly-chart"/);
    assert.match(index, /id="comparison-table"/);
    assert.doesNotMatch(index, /id="(transaction-form|salary-form|balance-form)"/);
    assert.doesNotMatch(index, /id="auth-form"/);
    assert.match(page.headers.get('content-security-policy'), /frame-ancestors 'none'/);
    assert.match((await fetch(origin + '/domain.js')).headers.get('content-type'), /^text\/javascript/);
    const stateResponse = await fetch(origin + '/api/state');
    assert.equal(stateResponse.headers.get('cache-control'), 'no-store');
    assert.equal(stateResponse.headers.get('cross-origin-resource-policy'), 'same-origin');
    assert.equal(stateResponse.headers.get('referrer-policy'), 'no-referrer');
    assert.equal((await call('/api/state')).status, 200);
    assert.equal((await call('/api/state', 'GET', undefined, 'http://example.invalid')).status, 403);
    assert.equal((await fetch(origin + '/api/state', { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status, 403);
    assert.equal((await call('/api/banking/ing/disconnect', 'POST', {}, origin.replace('127.0.0.1', 'localhost'))).status, 403);
    assert.equal((await call('/api/banking/ing/disconnect', 'POST', {}, 'http://example.invalid')).status, 403);
    assert.equal((await call('/api/banking/ing/connect', 'POST', {})).status, 400);

    const { value } = await call('/api/state?month=2026-11');
    assert.equal(value.banking.connected, true);
    assert.equal(value.banking.configured, false);
    assert.deepEqual(value.balance, { cents: 1111, kind: 'booked' });
    assert.deepEqual(value.summary, { credits: 1222, debits: 155 });
    assert.equal(value.period.to, '2026-11-10');
    assert.deepEqual(value.monthly.months.at(-1), {
      month: '2026-11', from: '2026-11-01', to: '2026-11-10', partial: true, credits: 1222, debits: 155
    });
    assert.equal(value.salaryDate, '2026-11-30');
    assert.deepEqual(value.transactions.map(item => item.note), ['Abono sintético', 'Cargo sintético', 'Cargo repetido', 'Cargo repetido']);
    assert.doesNotMatch(JSON.stringify(value), /Movimiento manual sintético|sesión-sintética|cuenta-sintética/);
    const [credit, expense, ...duplicates] = value.transactions;
    assert.equal(credit.id, undefined);
    assert.match(expense.id, /^[a-f0-9]{64}$/);
    assert.equal(expense.categoryOverride, null);
    assert.ok(duplicates.every(item => item.id === undefined));

    const changeCategory = (category, id = expense.id, requestOrigin) =>
      call('/api/movements/category', 'POST', { id, category }, requestOrigin);
    assert.equal((await changeCategory('shopping', expense.id, 'http://example.invalid')).status, 403);
    assert.equal((await changeCategory('salary')).status, 400);
    assert.equal((await changeCategory('x'.repeat(512))).status, 400);
    assert.equal((await changeCategory('shopping', 'a'.repeat(64))).status, 409);
    assert.equal((await changeCategory('shopping')).status, 200);
    const categorized = (await call('/api/state?month=2026-11')).value;
    assert.deepEqual(categorized.summary, value.summary);
    assert.equal(bankDashboard(categorized).categories.find(item => item.id === 'shopping').debits, 111);

    const september = (await call('/api/state?month=2026-09')).value;
    assert.equal((await changeCategory('groceries', september.transactions[0].id)).status, 200);
    const october = (await call('/api/state?month=2026-10')).value;
    assert.deepEqual(october.transactions, []);
    assert.deepEqual(october.monthly.comparison.categories, [
      { id: 'groceries', label: 'Supermercado', current: 0, previous: 320 }
    ]);

    // La consulta antigua carecía de referencias. Una nueva consulta pasa a identificarlas.
    const refresh = new DatabaseSync(path);
    try {
      const snapshot = JSON.parse(refresh.prepare('SELECT snapshot FROM ing_connection').get().snapshot);
      snapshot.transactions.reverse().forEach((item, index) => { item.referenceHash = String(index).repeat(64); });
      refresh.prepare('UPDATE ing_connection SET snapshot=?').run(JSON.stringify(snapshot));
    } finally {
      refresh.close();
    }
    const refreshed = (await call('/api/state?month=2026-11')).value;
    assert.doesNotMatch(JSON.stringify(refreshed), /referenceHash/);
    const refreshedExpense = refreshed.transactions.find(item => item.note === expense.note);
    assert.notEqual(refreshedExpense.id, expense.id);
    assert.equal(refreshedExpense.categoryOverride, 'shopping');
    const [first, second] = refreshed.transactions.filter(item => item.note === 'Cargo repetido');
    assert.notEqual(first.id, second.id);
    assert.equal((await changeCategory('transport', first.id)).status, 200);

    for (const endpoint of ['/api/accounts', '/api/accounts/1/balance', '/api/transactions', '/api/salary']) {
      assert.equal((await call(endpoint, 'POST', {})).status, 404);
    }
    assert.equal((await call('/api/banking/ing/sync', 'POST', {})).status, 400);
    assert.deepEqual((await call('/api/state?month=2026-11')).value.balance, value.balance);
    await stop();
    await start();
    const restarted = (await call('/api/state?month=2026-11')).value;
    assert.deepEqual(restarted.summary, value.summary);
    assert.equal(restarted.transactions.find(item => item.id === first.id).categoryOverride, 'transport');
    assert.equal(restarted.transactions.find(item => item.id === second.id).categoryOverride, null);
    assert.equal((await changeCategory(null, refreshedExpense.id)).status, 200);
    const reset = (await call('/api/state?month=2026-11')).value;
    assert.equal(reset.transactions.find(item => item.id === refreshedExpense.id).categoryOverride, null);
    assert.equal((await call('/api/banking/ing/disconnect', 'POST', {})).status, 200);
    const disconnected = (await call('/api/state?month=2026-11')).value;
    assert.equal(disconnected.banking.connected, false);
    assert.equal(disconnected.balance, null);
    assert.deepEqual(disconnected.transactions, []);
    assert.deepEqual(disconnected.monthly, { months: [], comparison: null });

    await stop();
    const migrated = new DatabaseSync(path, { readOnly: true });
    try {
      assert.equal(migrated.prepare('SELECT note FROM transaction_entry').get().note, 'Movimiento manual sintético');
      assert.equal(migrated.prepare('SELECT count(*) AS count FROM ing_connection').get().count, 0);
      assert.equal(migrated.prepare('SELECT count(*) AS count FROM expense_category_override').get().count, 0);
    } finally {
      migrated.close();
    }
  } finally {
    await stop();
    const target = resolve(dir);
    assert.equal(resolve(target, '..'), resolve(tmpdir()));
    rmSync(target, { recursive: true, force: true });
  }
});

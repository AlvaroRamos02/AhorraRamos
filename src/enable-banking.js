import { createHash, createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { bankingHistoryDays, madridDate, parseSignedCents, validDate } from './domain.js';

const baseUrl = 'https://api.enablebanking.com';
const authorizationOrigins = new Set(['https://auth.enablebanking.com', 'https://tilisy.enablebanking.com']);
const b64url = value => Buffer.from(value).toString('base64url');
export const providerIdIsValid = value => typeof value === 'string' && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);

export function ingConfiguration(port) {
  const appId = String(process.env.ENABLE_BANKING_APP_ID || '');
  const keyPath = String(process.env.ENABLE_BANKING_PRIVATE_KEY_PATH || '');
  const redirect = String(process.env.ENABLE_BANKING_REDIRECT_URL || '');
  if (!providerIdIsValid(appId) || !keyPath || !redirect || !process.env.LOCAL_TLS_KEY_PATH || !process.env.LOCAL_TLS_CERT_PATH) throw new Error('La integración ING requiere el ID, la clave privada y HTTPS local.');
  const url = new URL(redirect);
  if (url.protocol !== 'https:' || !['127.0.0.1', 'localhost'].includes(url.hostname) || Number(url.port || 443) !== port || url.pathname !== '/api/banking/ing/callback' || url.username || url.password || url.search || url.hash) throw new Error('La URL de retorno de ING debe usar HTTPS local y coincidir con este servidor.');
  return { appId, keyPath: resolve(keyPath), redirectUrl: url.toString() };
}

export function ingIsConfigured(port) {
  try { ingConfiguration(port); return true; } catch { return false; }
}

function authorization(config) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ typ: 'JWT', alg: 'RS256', kid: config.appId }));
  const body = b64url(JSON.stringify({ iss: 'enablebanking.com', aud: 'api.enablebanking.com', iat: now, exp: now + 300 }));
  try {
    const signer = createSign('RSA-SHA256');
    signer.update(`${header}.${body}`); signer.end();
    return `Bearer ${header}.${body}.${signer.sign(readFileSync(config.keyPath)).toString('base64url')}`;
  } catch { throw new Error('La clave privada de Enable Banking no es válida.'); }
}

async function request(config, path, options = {}) {
  const abort = AbortSignal.timeout(15_000);
  const token = authorization(config);
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, { ...options, redirect: 'error', signal: abort, headers: { Accept: 'application/json', Authorization: token, ...(options.headers || {}) } });
  } catch { throw new Error('No se ha podido contactar de forma segura con Enable Banking.'); }
  if (options.method === 'DELETE' && (response.ok || [404, 410].includes(response.status))) return;
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload) throw new Error('Enable Banking no ha podido completar la operación.');
  return payload;
}

export async function startIngAuthorization(config, state) {
  const validUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
  const started = await request(config, '/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
    access: { balances: true, transactions: true, transactions_extended_history: false, valid_until: validUntil },
    aspsp: { name: 'ING', country: 'ES' }, psu_type: 'personal', state, redirect_url: config.redirectUrl, language: 'es'
  }) });
  const destination = typeof started.url === 'string' ? URL.parse(started.url) : null;
  if (!destination || destination.protocol !== 'https:' || !authorizationOrigins.has(destination.origin) || destination.username || destination.password) {
    throw new Error('Enable Banking ha devuelto una URL de autorización no válida.');
  }
  return destination.href;
}

export async function authorizeIngSession(config, code) {
  if (typeof code !== 'string' || code.length < 1 || code.length > 4096) throw new Error('La autorización devuelta por el banco no es válida.');
  return request(config, '/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
}

export async function readIngAccount(config, accountId) {
  if (!providerIdIsValid(accountId)) throw new Error('La cuenta devuelta por el banco no es válida.');
  const now = new Date();
  const from = madridDate(bankingHistoryDays - 1, now);
  const to = madridDate(0, now);
  const [balances, transactions] = await Promise.all([
    request(config, `/accounts/${encodeURIComponent(accountId)}/balances`),
    readTransactions(config, accountId, from, to)
  ]);
  return { ...normalizeBalance(balances), from, to, transactions: transactions.map(normalizeTransaction).filter(Boolean).sort((a, b) => b.date.localeCompare(a.date)) };
}

async function readTransactions(config, accountId, from, to) {
  const collected = []; let continuation = '';
  for (let page = 0; page < 50; page++) {
    const query = new URLSearchParams({ date_from: from, date_to: to, transaction_status: 'BOOK', strategy: 'default' });
    if (continuation) query.set('continuation_key', continuation);
    const result = await request(config, `/accounts/${encodeURIComponent(accountId)}/transactions?${query}`);
    if (!Array.isArray(result.transactions)) throw new Error('La respuesta de movimientos del banco no es válida.');
    collected.push(...result.transactions);
    if (!result.continuation_key) return collected;
    if (typeof result.continuation_key !== 'string' || result.continuation_key.length > 4096) throw new Error('La paginación del banco no es válida.');
    continuation = result.continuation_key;
  }
  throw new Error('El banco ha devuelto demasiadas páginas de movimientos.');
}

function normalizeBalance(result) {
  const balances = Array.isArray(result?.balances) ? result.balances : [];
  const eur = balances.filter(b => b?.balance_amount?.currency === 'EUR');
  const available = ['ITAV', 'CLAV'].map(type => eur.find(b => b.balance_type === type)).find(Boolean);
  const booked = ['ITBD', 'CLBD'].map(type => eur.find(b => b.balance_type === type)).find(Boolean);
  const chosen = booked || available;
  if (!chosen) throw new Error('ING no ha devuelto un saldo en EUR.');
  return { balanceCents: parseSignedCents(chosen.balance_amount.amount), balanceKind: booked ? 'booked' : 'available' };
}

function normalizeTransaction(transaction) {
  if (transaction?.status !== 'BOOK') return null;
  const direction = transaction.credit_debit_indicator;
  if (direction !== 'CRDT' && direction !== 'DBIT') throw new Error('ING ha devuelto un movimiento sin dirección válida.');
  if (transaction.transaction_amount?.currency !== 'EUR') throw new Error('ING ha devuelto un movimiento que no está en EUR.');
  const amount = Math.abs(parseSignedCents(transaction.transaction_amount.amount));
  const date = validDate(transaction.booking_date || transaction.value_date || transaction.transaction_date);
  const remittance = Array.isArray(transaction.remittance_information) ? transaction.remittance_information.join(' ') : '';
  const note = String(remittance || transaction.creditor?.name || transaction.debtor?.name || 'Movimiento ING').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 160) || 'Movimiento ING';
  const entry = transaction.entry_reference;
  const referenceHash = typeof entry === 'string' && entry ? createHash('sha256').update(entry).digest('hex') : null;
  return { amountCents: direction === 'CRDT' ? amount : -amount, date, note, referenceHash };
}

export async function closeIngSession(config, sessionId) {
  if (!providerIdIsValid(sessionId)) throw new Error('La sesión de ING no es válida.');
  await request(config, `/sessions/${encodeURIComponent(sessionId)}`, { method: 'DELETE' });
}

import http from 'node:http';
import https from 'node:https';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { atomic, db } from './db.js';
import { bankingMonth, expenseCategories, isInvestmentTransfer, madridDate, monthlyBankAnalysis, salaryDate } from './domain.js';
import { authorizeIngSession, closeIngSession, ingConfiguration, ingIsConfigured, providerIdIsValid, readIngAccount, startIngAuthorization } from './enable-banking.js';

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const tlsKeyPath=process.env.LOCAL_TLS_KEY_PATH, tlsCertPath=process.env.LOCAL_TLS_CERT_PATH;
const secure=Boolean(tlsKeyPath);
const scheme=secure?'https':'http';
const localOrigins = new Map();
for (const hostname of ['127.0.0.1', 'localhost']) {
  const origin = new URL(`${scheme}://${hostname}:${port}`).origin;
  localOrigins.set(`${hostname}:${port}`, origin);
  if (port === (secure ? 443 : 80)) localOrigins.set(hostname, origin);
}
const now = () => madridDate();
const dateTimeNow = () => new Date().toISOString();
const privateHeaders = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Resource-Policy': 'same-origin'
};
const reply = (res, status, body) => { res.writeHead(status, {...privateHeaders,'Content-Type':'application/json; charset=utf-8'}); res.end(JSON.stringify(body)); };
const fail = (res, status, message) => reply(res,status,{error:message});
const cookie = (req, name) => (req.headers.cookie || '').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1);
function ingConnection() { return db.prepare('SELECT * FROM ing_connection WHERE id=1').get(); }
const expenseCategoryIds = new Set(expenseCategories.map(({ id }) => id));
const readSnapshot = connection => connection?.snapshot ? JSON.parse(connection.snapshot) : null;

function expenseKeys(account, transactions) {
  const keys = new Map();
  const occurrences = new Map();
  const hash = (kind, value) => createHash('sha256').update(JSON.stringify([account, kind, value])).digest('hex');
  for (const item of transactions) {
    const candidates = [];
    if (item.referenceHash) candidates.push(hash('reference', item.referenceHash));
    candidates.push(hash('details', [item.date, item.amountCents, item.note]));
    keys.set(item, candidates);
    for (const key of candidates) occurrences.set(key, (occurrences.get(key) ?? 0) + 1);
  }
  return new Map([...keys].filter(([item]) => item.amountCents < 0)
    .map(([item, candidates]) => [item, candidates.filter(key => occurrences.get(key) === 1)]));
}

function appState(requestedMonth) {
  const today = now();
  const month = /^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(requestedMonth ?? '') ? requestedMonth : today.slice(0, 7);
  const connection = ingConnection();
  const snapshot = readSnapshot(connection);
  if (snapshot?.transactions.length) {
    const account = connection.provider_account_id;
    const keys = expenseKeys(account, snapshot.transactions);
    const overrides = new Map(db.prepare(
      'SELECT movement_key, category_id FROM expense_category_override WHERE account_id=?'
    ).all(account).map(row => [row.movement_key, row.category_id]));
    snapshot.transactions = snapshot.transactions.map(item => {
      const { date, amountCents, note } = item;
      const movement = { date, amountCents, note };
      if (isInvestmentTransfer(item, process.env.INVESTMENT_TRANSFER_RECIPIENT)) movement.investmentTransfer = true;
      const candidates = keys.get(item);
      if (!candidates?.length) return movement;
      return {
        ...movement, id: candidates[0],
        categoryOverride: candidates.map(key => overrides.get(key)).find(id => expenseCategoryIds.has(id)) ?? null
      };
    });
  }
  const lastSyncAt = connection?.last_sync_at ?? null;
  return {
    month,
    salaryDate: salaryDate(Number(month.slice(0, 4)), Number(month.slice(5))),
    banking: {
      configured: ingIsConfigured(port),
      connected: Boolean(connection),
      lastSyncAt,
      lastSyncError: connection?.last_sync_error ?? null
    },
    ...bankingMonth(snapshot, month, lastSyncAt),
    monthly: monthlyBankAnalysis(snapshot, month, today, lastSyncAt)
  };
}

async function readCategoryChange(req) {
  if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') return null;
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    bytes += chunk.length;
    if (bytes > 512) {
      req.resume();
      return null;
    }
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { return null; }
}

async function changeExpenseCategory(req, res) {
  const { id, category } = (await readCategoryChange(req)) ?? {};
  if (typeof id !== 'string' || !/^[0-9a-f]{64}$/.test(id) || (category !== null && !expenseCategoryIds.has(category))) {
    fail(res,400,'El movimiento o la categoría no son válidos.'); return;
  }
  const connection = ingConnection();
  const account = connection?.provider_account_id;
  const snapshot = readSnapshot(connection);
  const candidates = [...expenseKeys(account, snapshot?.transactions ?? []).values()].find(keys => keys.includes(id));
  if (!candidates) { fail(res,409,'El cargo ya no se puede identificar. Actualiza los movimientos.'); return; }

  atomic(() => {
    const remove = db.prepare('DELETE FROM expense_category_override WHERE account_id=? AND movement_key=?');
    for (const key of candidates) remove.run(account, key);
    if (category !== null) {
      db.prepare('INSERT INTO expense_category_override (account_id,movement_key,category_id) VALUES (?,?,?)')
        .run(account, candidates[0], category);
    }
  });
  reply(res,200,{ok:true});
}
let pendingIng=null;
let ingSyncInFlight=null;
async function synchronizeIng() {
  const connection=ingConnection();
  if (!connection) throw new Error('No hay una cuenta ING conectada.');
  const sessionId=connection.provider_session_id;
  if (ingSyncInFlight?.sessionId===sessionId) return ingSyncInFlight.work;
  const work=(async()=>{
    try {
      const remote=await readIngAccount(ingConfiguration(port),connection.provider_account_id);
      db.prepare('UPDATE ing_connection SET snapshot=?,last_sync_at=?,last_sync_error=NULL WHERE provider_session_id=?').run(JSON.stringify(remote),dateTimeNow(),sessionId);
    } catch (error) {
      db.prepare('UPDATE ing_connection SET last_sync_error=? WHERE provider_session_id=?').run('No se ha podido actualizar ING. Inténtalo de nuevo o reconecta la cuenta.',sessionId);
      throw error;
    }
  })();
  ingSyncInFlight={sessionId,work};
  try { return await work; }
  finally { if (ingSyncInFlight?.work===work) ingSyncInFlight=null; }
}

const ingCookie='__Secure-ing_return';
const ingCookieHeader=(value,maxAge)=>`${ingCookie}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/api/banking/ing/callback; Max-Age=${maxAge}`;
function redirectIng(res,result) {
  res.writeHead(303,{...privateHeaders,Location:`/?ing=${result}`});
  res.end();
}

async function completeIngAuthorization(req,res,url,origin) {
  const pending=pendingIng;
  if (!pending || pending.active || pending.expiresAt<=Date.now() || new URL(pending.config.redirectUrl).origin!==origin ||
      url.searchParams.get('state')!==pending.state ||
      cookie(req,ingCookie)!==pending.verifier) {
    redirectIng(res,'cancelled');
    return;
  }
  res.setHeader('Set-Cookie',ingCookieHeader('',0));
  pending.active=true;
  const code=url.searchParams.get('code');
  let sessionId;
  try {
    if (!code || url.searchParams.has('error')) {
      redirectIng(res,'cancelled');
      return;
    }
    const session=await authorizeIngSession(pending.config,code);
    sessionId=session?.session_id;
    const selected=session?.accounts?.[0];
    if (!providerIdIsValid(sessionId) || !Array.isArray(session.accounts) || session.accounts.length!==1 ||
        !providerIdIsValid(selected?.uid) || (selected.currency && selected.currency!=='EUR') ||
        session.aspsp?.name!=='ING' || session.aspsp.country!=='ES') {
      throw new Error('ING debe autorizar exactamente una cuenta en EUR.');
    }
    if (pendingIng!==pending) throw new Error('La autorización local ha caducado.');
    const previous=ingConnection();
    if (previous && previous.provider_session_id!==sessionId) {
      await closeIngSession(pending.config,previous.provider_session_id);
      if (pendingIng!==pending) throw new Error('La autorización local ha caducado.');
    }
    atomic(() => {
      db.prepare('DELETE FROM expense_category_override WHERE account_id<>?').run(selected.uid);
      db.prepare(`INSERT INTO ing_connection(id,provider_session_id,provider_account_id,connected_at) VALUES(1,?,?,?)
        ON CONFLICT(id) DO UPDATE SET provider_session_id=excluded.provider_session_id,
        provider_account_id=excluded.provider_account_id,connected_at=excluded.connected_at,last_sync_at=NULL,last_sync_error=NULL,snapshot=NULL`)
        .run(sessionId,selected.uid,dateTimeNow());
    });
    await synchronizeIng().catch(()=>{});
    redirectIng(res,'connected');
  } catch {
    if (providerIdIsValid(sessionId) && ingConnection()?.provider_session_id!==sessionId) {
      closeIngSession(pending.config,sessionId).catch(()=>{});
    }
    redirectIng(res,'failed');
  } finally {
    if (pendingIng===pending) pendingIng=null;
  }
}
function scheduleIngSynchronization() {
  let lastRun='';
  const check=()=>{
    const values=Object.fromEntries(new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit'}).formatToParts(new Date()).map(part=>[part.type,part.value]));
    const marker=`${values.year}-${values.month}-${values.day}-${values.hour}`;
    if ((values.hour==='08'||values.hour==='20') && marker!==lastRun) { lastRun=marker; synchronizeIng().catch(()=>{}); }
  };
  check(); setInterval(check,60_000).unref();
}

const handler=async(req,res)=>{
  try {
    const origin = localOrigins.get(req.headers.host);
    if (!origin) { fail(res,403,'Host no permitido'); return; }
    const url=URL.parse(req.url,origin);
    if (!url || url.origin!==origin) { fail(res,400,'Ruta no válida'); return; }
    const asset = assets.get(url.pathname);
    if (req.method==='GET' && asset) {
      const [path, mime] = asset;
      const content = await readFile(join(root,path));
      res.writeHead(200,{...privateHeaders,'Content-Type':`${mime}; charset=utf-8`,'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"});
      res.end(content); return;
    }
    if (!url.pathname.startsWith('/api/')) { fail(res,404,'No encontrado'); return; }
    if (url.pathname==='/api/banking/ing/callback' && req.method==='GET') {
      await completeIngAuthorization(req,res,url,origin); return;
    }
    if ((req.method!=='GET' || req.headers.origin) && req.headers.origin!==origin) { fail(res,403,'Origen no permitido'); return; }
    const fetchSite = req.headers['sec-fetch-site'];
    if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') { fail(res,403,'Origen no permitido'); return; }
    if (url.pathname==='/api/state' && req.method==='GET') {
      reply(res,200,appState(url.searchParams.get('month'))); return;
    }
    if (url.pathname==='/api/movements/category' && req.method==='POST') {
      await changeExpenseCategory(req,res); return;
    }
    if (url.pathname==='/api/banking/ing/connect' && req.method==='POST') {
      let config;
      try { config=ingConfiguration(port); }
      catch { fail(res,400,'Revisa la configuración de Enable Banking y HTTPS local.'); return; }
      if (origin!==new URL(config.redirectUrl).origin) {
        fail(res,400,'Abre AhorraRamos desde el mismo origen configurado para el retorno de ING.');
        return;
      }
      const pending={
        config, expiresAt:Date.now()+15*60_000,
        state:randomBytes(32).toString('base64url'), verifier:randomBytes(32).toString('base64url')
      };
      pendingIng=pending;
      let destination;
      try { destination=await startIngAuthorization(config,pending.state); }
      catch {
        if (pendingIng===pending) pendingIng=null;
        fail(res,502,'No se ha podido iniciar la autorización con Enable Banking.');
        return;
      }
      if (pendingIng!==pending || pending.expiresAt<=Date.now()) { fail(res,409,'La autorización local ha caducado.'); return; }
      res.setHeader('Set-Cookie',ingCookieHeader(pending.verifier,15*60));
      reply(res,200,{url:destination}); return;
    }
    if (url.pathname==='/api/banking/ing/sync' && req.method==='POST') {
      try { await synchronizeIng(); }
      catch { fail(res,400,'No se ha podido actualizar la cuenta ING.'); return; }
      reply(res,200,{ok:true}); return;
    }
    if (url.pathname==='/api/banking/ing/disconnect' && req.method==='POST') {
      pendingIng=null;
      const connection=ingConnection(); if (!connection) { reply(res,200,{ok:true}); return; }
      atomic(() => {
        db.prepare('DELETE FROM expense_category_override WHERE account_id=?').run(connection.provider_account_id);
        db.prepare('DELETE FROM ing_connection WHERE provider_session_id=?').run(connection.provider_session_id);
      });
      let revoked=false;
      try { await closeIngSession(ingConfiguration(port),connection.provider_session_id); revoked=true; } catch { }
      reply(res,200,{ok:true,revoked}); return;
    }
    fail(res,404,'No encontrado');
  } catch { fail(res,500,'No se ha podido completar la solicitud local.'); }
};
const assets = new Map([
  ['/', ['public/index.html', 'text/html']],
  ['/app.js', ['public/app.js', 'text/javascript']],
  ['/style.css', ['public/style.css', 'text/css']],
  ['/domain.js', ['domain.js', 'text/javascript']]
]);
if (Boolean(tlsKeyPath) !== Boolean(tlsCertPath)) throw new Error('Configura los dos archivos TLS locales, clave y certificado.');
const server=secure?https.createServer({key:readFileSync(tlsKeyPath),cert:readFileSync(tlsCertPath)},handler):http.createServer(handler);
server.listen(port,'127.0.0.1',()=>{scheduleIngSynchronization();console.log(`AhorraRamos: ${scheme}://127.0.0.1:${port}`);});

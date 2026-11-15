import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { db, atomic, state } from './db.js';
import { salaryDate, parseCents, validDate, summarize } from './domain.js';

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const hash = x => createHash('sha256').update(x).digest('hex');
const passwordHash = (password,salt) => scryptSync(password,salt,64).toString('hex');
const now = () => new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const monthNow = () => new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit'}).format(new Date());
const reply = (res, status, body) => { res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}); res.end(JSON.stringify(body)); };
const fail = (res, status, message) => reply(res,status,{error:message});
const cookie = req => (req.headers.cookie || '').split(';').map(x=>x.trim()).find(x=>x.startsWith('session='))?.slice(8);
const authenticated = req => { const token=cookie(req); if (!token || !/^[a-f0-9]{64}$/.test(token)) return false; return !!db.prepare('SELECT 1 FROM session WHERE token_hash=? AND expires_at>?').get(hash(token),Date.now()); };
const setSession = res => { const token=randomBytes(32).toString('hex'); db.prepare('INSERT INTO session(token_hash,expires_at) VALUES(?,?)').run(hash(token),Date.now()+7*86400000); res.setHeader('Set-Cookie',`session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800`); };
async function body(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) throw new Error('Se requiere JSON');
  let value=''; for await (const chunk of req) { value+=chunk; if (value.length>20000) throw new Error('Solicitud demasiado grande'); }
  return JSON.parse(value);
}
async function readPassword(prompt, rl) {
  if (rl) return new Promise(resolve=>rl.question(prompt,resolve));
  process.stdout.write(prompt);
  process.stdin.setRawMode(true); process.stdin.resume();
  return new Promise((resolve,reject)=>{
    let value='';
    const finish=(answer,error)=>{process.stdin.off('data',onData);process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n');error?reject(error):resolve(answer);};
    const onData=chunk=>{for(const char of chunk.toString()){
      if(char==='\u0003'){finish('',new Error('Configuración cancelada'));return;}
      if(char==='\r'||char==='\n'){finish(value);return;}
      if(char==='\u007f'||char==='\b'){value=value.slice(0,-1);continue;}
      if(char>=' '&&char<='~'||char.charCodeAt(0)>=128)value+=char;
    }};
    process.stdin.on('data',onData);
  });
}
async function configurePassword() {
  const existing=db.prepare('SELECT 1 FROM user WHERE id=1').get();
  let password,confirmation;
  if(process.stdin.isTTY) {
    password=await readPassword('Nueva contraseña (mínimo 12 caracteres): ');
    confirmation=await readPassword('Repite la contraseña: ');
  } else {
    const rl=createInterface({input:process.stdin,output:process.stdout});
    process.stdout.write('Nueva contraseña (mínimo 12 caracteres): Repite la contraseña: ');
    const lines=[]; for await(const line of rl) lines.push(line); rl.close();
    password=lines[0]||''; confirmation=lines[1]||'';
  }
  if(password.length<12) throw new Error('La contraseña debe tener 12 caracteres como mínimo.');
  if(password!==confirmation) throw new Error('Las contraseñas no coinciden.');
  const salt=randomBytes(16).toString('hex');
  atomic(()=>{
    if(existing) db.prepare('UPDATE user SET salt=?,password_hash=? WHERE id=1').run(salt,passwordHash(password,salt));
    else db.prepare('INSERT INTO user(id,salt,password_hash) VALUES(1,?,?)').run(salt,passwordHash(password,salt));
    db.prepare('DELETE FROM session').run();
  });
  console.log(`${existing?'Contraseña cambiada':'Contraseña configurada'}; las sesiones anteriores se han cerrado. Inicia la aplicación con \`npm start\`.`);
}
function account(id) { const a=db.prepare('SELECT * FROM account WHERE id=?').get(Number(id)); if (!a) throw new Error('Cuenta no encontrada'); return a; }
function category(id) { const c=db.prepare('SELECT * FROM category WHERE id=? AND archived=0').get(Number(id)); if (!c) throw new Error('Categoría no encontrada'); return c; }
function audit(id,action,snapshot) { db.prepare('INSERT INTO audit(entity,entity_id,action,snapshot) VALUES(?,?,?,?)').run('transaction',id,action,JSON.stringify(snapshot)); }
function transactionInput(data) {
  const type=String(data.type || ''); if (!['income','expense','transfer'].includes(type)) throw new Error('Tipo no válido');
  const amount=parseCents(String(data.amount || ''));
  const date=validDate(data.date);
  const a=account(data.accountId);
  const destination=type==='transfer' ? account(data.destinationId) : null;
  if (destination?.id===a.id) throw new Error('Elige otra cuenta de destino');
  const c=type==='expense' ? category(data.categoryId) : null;
  const note=String(data.note || '').trim(); if (note.length>160) throw new Error('Concepto demasiado largo');
  return {type,amount,date,accountId:a.id,destinationId:destination?.id || null,categoryId:c?.id || null,note};
}
function insertTransaction(t,salaryMonth=null) {
  const result=db.prepare(`INSERT INTO transaction_entry(type,amount_cents,date,account_id,destination_id,category_id,note,salary_month) VALUES(?,?,?,?,?,?,?,?)`).run(t.type,t.amount,t.date,t.accountId,t.destinationId,t.categoryId,t.note,salaryMonth);
  audit(Number(result.lastInsertRowid),'create',t); return Number(result.lastInsertRowid);
}

const server=http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,`http://127.0.0.1:${port}`);
    if (req.method==='GET' && ['/', '/app.js','/style.css'].includes(url.pathname)) {
      const name=url.pathname==='/'?'index.html':url.pathname.slice(1);
      const mime=name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html';
      res.writeHead(200,{'Content-Type':`${mime}; charset=utf-8`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});
      res.end(await readFile(join(root,'public',name))); return;
    }
    if (!url.pathname.startsWith('/api/')) { fail(res,404,'No encontrado'); return; }
    if (req.method!=='GET' && req.headers.origin !== `http://127.0.0.1:${port}` && req.headers.origin !== `http://localhost:${port}`) { fail(res,403,'Origen no permitido'); return; }
    if (url.pathname==='/api/session' && req.method==='GET') { reply(res,200,{configured:!!db.prepare('SELECT 1 FROM user').get(),authenticated:authenticated(req)}); return; }
    if (url.pathname==='/api/login' && req.method==='POST') {
      const data=await body(req), user=db.prepare('SELECT * FROM user WHERE id=1').get();
      if (!user || typeof data.password!=='string' || data.password.length>1024) { fail(res,401,'Contraseña incorrecta'); return; }
      const actual=Buffer.from(passwordHash(data.password,user.salt),'hex'), expected=Buffer.from(user.password_hash,'hex');
      if (!timingSafeEqual(actual,expected)) { fail(res,401,'Contraseña incorrecta'); return; }
      setSession(res); reply(res,200,{ok:true}); return;
    }
    if (!authenticated(req)) { fail(res,401,'Inicia sesión'); return; }
    if (url.pathname==='/api/logout' && req.method==='POST') { db.prepare('DELETE FROM session WHERE token_hash=?').run(hash(cookie(req))); res.setHeader('Set-Cookie','session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); reply(res,200,{ok:true}); return; }
    if (url.pathname==='/api/state' && req.method==='GET') {
      const month=/^\d{4}-(0[1-9]|1[0-2])$/.test(url.searchParams.get('month')||'')?url.searchParams.get('month'):monthNow();
      const data=state(month); reply(res,200,{...data,month,summary:summarize(data.accounts,data.transactions,month),today:now()}); return;
    }
    if (url.pathname==='/api/accounts' && req.method==='POST') {
      const data=await body(req), name=String(data.name||'').trim(), kind=String(data.kind||'');
      if (!name || name.length>60 || !['checking','savings','cash','investment'].includes(kind)) throw new Error('Cuenta no válida');
      const opening=data.opening ? parseCents(String(data.opening)) : 0;
      const openingDate=validDate(data.openingDate);
      db.prepare('INSERT INTO account(name,kind,opening_cents,opening_date) VALUES(?,?,?,?)').run(name,kind,opening,openingDate); reply(res,201,{ok:true}); return;
    }
    if (url.pathname==='/api/categories' && req.method==='POST') {
      const data=await body(req), name=String(data.name||'').trim(); if (!name || name.length>40) throw new Error('Categoría no válida');
      db.prepare('INSERT INTO category(name) VALUES(?)').run(name); reply(res,201,{ok:true}); return;
    }
    if (url.pathname==='/api/transactions' && req.method==='POST') {
      const t=transactionInput(await body(req)); atomic(()=>insertTransaction(t)); reply(res,201,{ok:true}); return;
    }
    const match=url.pathname.match(/^\/api\/transactions\/(\d+)$/);
    if (match && ['PUT','DELETE'].includes(req.method)) {
      const old=db.prepare('SELECT * FROM transaction_entry WHERE id=?').get(Number(match[1])); if (!old) { fail(res,404,'Movimiento no encontrado'); return; }
      if (old.salary_month) throw new Error('La nómina confirmada se gestiona desde el calendario');
      if (req.method==='DELETE') { atomic(()=>{audit(old.id,'delete',old); db.prepare('DELETE FROM transaction_entry WHERE id=?').run(old.id);}); reply(res,200,{ok:true}); return; }
      const t=transactionInput(await body(req)); atomic(()=>{audit(old.id,'before_update',old); db.prepare('UPDATE transaction_entry SET type=?,amount_cents=?,date=?,account_id=?,destination_id=?,category_id=?,note=? WHERE id=?').run(t.type,t.amount,t.date,t.accountId,t.destinationId,t.categoryId,t.note,old.id);}); reply(res,200,{ok:true}); return;
    }
    if (url.pathname==='/api/salary' && req.method==='GET') {
      const year=Number(url.searchParams.get('year')), month=Number(url.searchParams.get('month'));
      const date=salaryDate(year,month), key=`${year}-${String(month).padStart(2,'0')}`;
      const confirmed=db.prepare('SELECT * FROM transaction_entry WHERE salary_month=?').get(key);
      reply(res,200,{date,month:key,confirmed:confirmed||null}); return;
    }
    if (url.pathname==='/api/salary' && req.method==='POST') {
      const data=await body(req), key=String(data.month||''); if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(key)) throw new Error('Mes no válido');
      const existing=db.prepare('SELECT id FROM transaction_entry WHERE salary_month=?').get(key);
      if (existing) { reply(res,200,{id:existing.id,alreadyConfirmed:true}); return; }
      const actualDate=validDate(data.date||salaryDate(Number(key.slice(0,4)),Number(key.slice(5))));
      const destinationAccount=account(data.accountId);
      const t={type:'income',amount:parseCents(String(data.amount||'')),date:actualDate,accountId:destinationAccount.id,destinationId:null,categoryId:null,note:'Nómina '+key};
      let id; atomic(()=>{id=insertTransaction(t,key);}); reply(res,201,{id,alreadyConfirmed:false}); return;
    }
    fail(res,404,'No encontrado');
  } catch(error) { const message=error instanceof SyntaxError?'JSON no válido':error.message; fail(res,400,message); }
});
if(process.argv.includes('--set-password')) {
  configurePassword().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>db.close());
} else if(!db.prepare('SELECT 1 FROM user WHERE id=1').get()) {
  console.error('AhorraRamos aún no está configurado. Ejecuta `node src/server.js --set-password` para crear una contraseña local.');
  db.close(); process.exitCode=1;
} else {
  server.listen(port,'127.0.0.1',()=>console.log(`AhorraRamos: http://127.0.0.1:${port}`));
}

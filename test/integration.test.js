import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

test('acceso, cuenta única, borrado de gasto, nómina idempotente y persistencia', async () => {
  const dir=mkdtempSync(join(tmpdir(),'ahorra-ramos-'));
  const port=31000+Math.floor(Math.random()*10000);
  const origin=`http://127.0.0.1:${port}`;
  const resolvePath=resolve('src/server.js');
  let child;
  const start=async()=>{
    let output='';
    child=spawn(process.execPath,[resolve('src/server.js')],{env:{...process.env,DATA_DIR:dir,PORT:String(port)},stdio:['ignore','pipe','pipe']});
    child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);
    for(let i=0;i<100;i++){try{const r=await fetch(origin+'/api/session');if(r.ok)return;}catch{}if(child.exitCode!==null)break;await new Promise(r=>setTimeout(r,50));}
    throw new Error('El servidor no inició: '+output);
  };
  const stop=async()=>{if(!child)return;const c=child;child=null;c.kill();await new Promise(resolve=>c.once('exit',resolve));};
  const configure=(password='contraseña-de-prueba-123')=>new Promise((resolve,reject)=>{
    const setup=spawn(process.execPath,[resolvePath,'--set-password'],{env:{...process.env,DATA_DIR:dir},stdio:['pipe','pipe','pipe']});
    let output='';setup.stdout.on('data',b=>output+=b);setup.stderr.on('data',b=>output+=b);
    setup.once('error',reject);setup.once('exit',code=>code===0?resolve(output):reject(new Error('No se pudo configurar contraseña: '+output)));
    setup.stdin.end(`${password}\n${password}\n`);
  });
  let cookie='';
  const call=async(path,method='GET',body)=>{
    const r=await fetch(origin+path,{method,headers:{Origin:origin,Cookie:cookie,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
    const value=await r.json();if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];return {status:r.status,value};
  };
  try{
    await configure();
    await start();
    assert.equal((await call('/api/state')).status,401);
    assert.deepEqual((await call('/api/session')).value,{configured:true,authenticated:false});
    assert.equal((await call('/api/login','POST',{password:'contraseña-de-prueba-123'})).status,200);
    assert.equal((await call('/api/setup','POST',{password:'contraseña-de-prueba-123'})).status,404);
    assert.equal((await call('/api/accounts','POST',{name:'Corriente',kind:'checking',openingDate:'2026-11-01'})).status,201);
    assert.equal((await call('/api/accounts','POST',{name:'Ahorro',kind:'savings',openingDate:'2026-11-01'})).status,400);
    const initial=(await call('/api/state?month=2026-11')).value;
    const work=initial.categories.find(c=>c.name==='Trabajo').id;
    assert.equal((await call('/api/transactions','POST',{type:'expense',amount:'25,00',date:'2020-05-10',accountId:1,categoryId:work})).status,201);
    assert.equal((await call('/api/state?month=2020-05')).value.summary.total,0);
    assert.equal((await call('/api/state?month=2020-05')).value.summary.expenses,2500);
    const date='2026-11-15';
    assert.equal((await call('/api/transactions','POST',{type:'income',amount:'1000,00',date,accountId:1})).status,201);
    const expense=await call('/api/transactions','POST',{type:'expense',amount:'100,00',date,accountId:1,categoryId:work});
    assert.equal(expense.status,201);
    let s=(await call('/api/state?month=2026-11')).value.summary;
    assert.equal(s.total,90000);assert.equal(s.expenses,10000);assert.equal(s.generatedSavings,90000);
    const created=(await call('/api/state?month=2026-11')).value.transactions.find(t=>t.type==='expense'&&t.date===date);
    assert.equal((await call(`/api/transactions/${created.id}`,'DELETE',{})).status,200);
    s=(await call('/api/state?month=2026-11')).value.summary;
    assert.equal(s.total,100000);assert.equal(s.expenses,0);assert.equal(s.generatedSavings,100000);
    assert.equal((await call('/api/transactions','POST',{type:'transfer',amount:'200,00',date,accountId:1,destinationId:2})).status,400);
    assert.equal((await call('/api/accounts/1/balance','POST',{balance:'777,77'})).status,200);
    s=(await call('/api/state?month=2026-11')).value.summary;
    assert.equal(s.balances[1],77777);assert.equal(s.total,77777);assert.equal(s.generatedSavings,100000);
    assert.equal((await call('/api/salary?year=2026&month=11')).value.date,'2026-11-30');
    assert.equal((await call('/api/state?month=2026-11')).value.summary.total,77777);
    const salary={month:'2026-11',amount:'1500,00',date:'2026-11-30',accountId:1};
    assert.equal((await call('/api/salary','POST',salary)).status,201);
    assert.equal((await call('/api/salary','POST',salary)).value.alreadyConfirmed,true);
    assert.equal((await call('/api/state?month=2026-11')).value.summary.total,227777);
    await stop();await start();
    assert.equal((await call('/api/state?month=2026-11')).value.summary.total,227777);
    await stop();
    await configure('contraseña-nueva-de-prueba-456');
    await start();
    assert.equal((await call('/api/state?month=2026-11')).status,401);
    assert.equal((await call('/api/login','POST',{password:'contraseña-de-prueba-123'})).status,401);
    assert.equal((await call('/api/login','POST',{password:'contraseña-nueva-de-prueba-456'})).status,200);
    assert.equal((await call('/api/state?month=2026-11')).value.summary.total,227777);
  } finally { await stop();rmSync(dir,{recursive:true,force:true}); }
});

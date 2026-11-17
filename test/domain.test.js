import test from 'node:test';
import assert from 'node:assert/strict';
import { salaryDate, parseCents, summarize } from '../src/domain.js';

test('nómina el penúltimo día y lunes siguiente', () => {
  for (const [y,m,expected] of [[2026,11,'2026-11-30'],[2026,2,'2026-02-27'],[2027,2,'2027-03-01'],[2028,2,'2028-02-28'],[2021,2,'2021-03-01']]) assert.equal(salaryDate(y,m), expected);
  assert.throws(() => salaryDate(20,2), /Mes no válido/);
  assert.throws(() => salaryDate(2026,13), /Mes no válido/);
});
test('los movimientos anteriores al saldo inicial se conservan como histórico sin alterar el saldo actual', () => {
  const accounts=[{id:1,kind:'checking',opening_cents:50000,opening_date:'2026-11-01'}];
  const transactions=[{type:'expense',status:'confirmed',account_id:1,amount_cents:10000,date:'2020-05-10',category_name:'Trabajo'}];
  assert.deepEqual(summarize(accounts,transactions,'2020-05'),{balances:{1:50000},total:50000,income:0,expenses:10000,generatedSavings:-10000,savedTransfer:0,byCategory:{Trabajo:10000}});
});
test('euros exactos', () => { assert.equal(parseCents('1000,01'),100001); assert.throws(() => parseCents('1.001,00')); });
test('transferir ahorro no altera el total ni el ahorro generado', () => {
  const a=[{id:1,kind:'checking',opening_cents:0},{id:2,kind:'savings',opening_cents:0}];
  const t=[{type:'income',status:'confirmed',account_id:1,amount_cents:100000,date:'2026-11-15'},{type:'expense',status:'confirmed',account_id:1,amount_cents:10000,date:'2026-11-15',category_name:'Trabajo'},{type:'transfer',status:'confirmed',account_id:1,destination_id:2,amount_cents:20000,date:'2026-11-15'}];
  assert.deepEqual(summarize(a,t,'2026-11'),{balances:{1:70000,2:20000},total:90000,income:100000,expenses:10000,generatedSavings:90000,savedTransfer:20000,byCategory:{Trabajo:10000}});
});

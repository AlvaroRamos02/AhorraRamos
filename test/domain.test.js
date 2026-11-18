import test from 'node:test';
import assert from 'node:assert/strict';
import { bankDashboard, bankingMonth, groupMovements, isInvestmentTransfer, monthlyBankAnalysis, movementTotals, offsetMonth, parseSignedCents, salaryDate } from '../src/domain.js';

test('nómina el penúltimo día y lunes siguiente', () => {
  for (const [year, month, expected] of [
    [2026, 11, '2026-11-30'], [2026, 2, '2026-02-27'], [2027, 2, '2027-03-01'], [2028, 2, '2028-02-28']
  ]) assert.equal(salaryDate(year, month), expected);
  assert.throws(() => salaryDate(20, 2), /Mes no válido/);
  assert.throws(() => salaryDate(2026, 13), /Mes no válido/);
});

test('euros exactos', () => {
  assert.equal(parseSignedCents('1000,01'), 100001);
  assert.equal(parseSignedCents('-0.01'), -1);
  assert.equal(parseSignedCents('-0.00'), 0);
  assert.throws(() => parseSignedCents('1.001,00'));
});

test('el resumen filtra por mes y periodo sin calcular el saldo', () => {
  const snapshot = {
    from: '2026-08-14', to: '2026-11-11', balanceCents: 12345, balanceKind: 'booked',
    transactions: [
      { date: '2026-11-12', amountCents: 123 },
      { date: '2026-11-11', amountCents: -210 },
      { date: '2026-11-01', amountCents: 200 },
      { date: '2026-10-30', amountCents: 300 }
    ]
  };
  assert.deepEqual(bankingMonth(snapshot, '2026-11'), {
    balance: { cents: 12345, kind: 'booked' },
    period: { from: snapshot.from, to: snapshot.to },
    summary: { credits: 200, debits: 210 },
    transactions: snapshot.transactions.slice(1, 3)
  });
  assert.equal(bankingMonth(snapshot, '2025-11').summary, null);
  assert.deepEqual(bankingMonth(snapshot, '2026-09').summary, { credits: 0, debits: 0 });
  assert.equal(bankingMonth(null, '2026-11').balance, null);
});

test('el análisis mensual compara los mismos días y aplica las categorías manuales', () => {
  const snapshot = {
    from: '2026-01-07', to: '2026-03-29', transactions: [
      { date: '2026-01-05', note: 'Fuera de la consulta', amountCents: -900 },
      { date: '2026-02-28', note: 'Amazon', amountCents: -800 },
      { date: '2026-03-28', note: 'Amazon', amountCents: -500, categoryOverride: 'groceries' },
      { date: '2026-03-28', note: 'Nómina', amountCents: 3000 },
      { date: '2026-03-29', note: 'Amazon', amountCents: -150 }
    ]
  };
  const { months, comparison } = monthlyBankAnalysis(snapshot, '2026-03', '2026-03-31');
  assert.deepEqual(months, [
    { month: '2026-01', from: '2026-01-07', to: '2026-01-31', partial: true, credits: 0, debits: 0 },
    { month: '2026-02', from: '2026-02-01', to: '2026-02-28', partial: false, credits: 0, debits: 800 },
    { month: '2026-03', from: '2026-03-01', to: '2026-03-29', partial: true, credits: 3000, debits: 650 }
  ]);
  assert.deepEqual(comparison.current, { from: '2026-03-01', to: '2026-03-28', credits: 3000, debits: 500 });
  assert.deepEqual(comparison.previous, { from: '2026-02-01', to: '2026-02-28', credits: 0, debits: 800 });
  assert.deepEqual(comparison.categories.map(({ id, current, previous }) => [id, current, previous]), [
    ['shopping', 0, 800], ['groceries', 500, 0]
  ]);
  assert.equal(monthlyBankAnalysis(snapshot, '2026-02', '2026-03-31').comparison, null);
  assert.equal(monthlyBankAnalysis(snapshot, '2026-03', '2026-04-01').comparison, null);
  const closed = monthlyBankAnalysis({ ...snapshot, to: '2026-03-31' }, '2026-03', '2026-04-01');
  assert.equal(closed.comparison.current.to, '2026-03-31');
  assert.equal(closed.comparison.current.debits, 650);
});

test('el panel conserva los céntimos y diferencia los cargos de los abonos por grupo', () => {
  const month = '2026-11';
  const snapshot = {
    from: '2026-11-09', to: '2026-11-11', balanceCents: 12345,
    transactions: [
      { date: '2026-11-11', amountCents: 420, note: 'Nómina' },
      { date: '2026-11-11', amountCents: -199, note: 'MERCADONA' },
      { date: '2026-11-09', amountCents: 99, note: 'mercadóna' },
      { date: '2026-11-09', amountCents: -25, note: 'Bizum' },
      { date: '2026-11-09', amountCents: 0, note: 'Concepto genérico' }
    ]
  };
  const dashboard = bankDashboard({ month, ...bankingMonth(snapshot, month) });
  assert.deepEqual(dashboard.days, [
    { date: '2026-11-09', credits: 99, debits: 25 },
    { date: '2026-11-10', credits: 0, debits: 0 },
    { date: '2026-11-11', credits: 420, debits: 199 }
  ]);
  assert.equal(dashboard.net, 295);
  assert.equal(dashboard.averageDailyDebits, 75);
  const selected = dashboard.movements.filter(item => item.category.id === 'groceries');
  assert.deepEqual(movementTotals(selected), { credits: 99, debits: 199 });
  assert.deepEqual(movementTotals([]), { credits: 0, debits: 0 });
  assert.deepEqual(dashboard.categories.map(item => [item.id, item.debits]), [['groceries', 199], ['transfer', 25]]);
  const groceries = groupMovements(dashboard.movements, 'concept').find(group => group.key === 'mercadona');
  assert.deepEqual([groceries.credits, groceries.debits, groceries.movements.length], [99, 199, 2]);
  assert.deepEqual(groupMovements(dashboard.movements, 'direction').map(group => group.key), ['credit', 'debit', 'zero']);
  assert.equal(groupMovements(dashboard.movements, 'date').length, 2);
  assert.equal(bankDashboard({ month, ...bankingMonth(snapshot, '2026-12') }), null);
  assert.equal(offsetMonth('2026-12', 1), '2027-01');
  assert.equal(offsetMonth('1000-01', -1), null);
});

test('el panel clasifica conceptos bancarios abreviados y conserva los ambiguos', () => {
  const month = '2026-11';
  const date = '2026-11-01';
  const examples = [
    ['Pago en BET365', 'gambling'],
    ['Pago en OPENAI *CHATGPT SUBSCR', 'leisure'],
    ['Pago en PLAYTOMIC.IO REF', 'sports'],
    ['Pago en EXTRACCIÓN CAJERO', 'cash'],
    ['Pago de impuestos', 'taxes'],
    ['Pago en FCIA. EJEMPLO', 'health'],
    ['Pago en UBER*EATS', 'dining'],
    ['Pago en APP CRTM', 'transport'],
    ['Pago en PULL&BEAR', 'shopping'],
    ['Pago en PELUQUERÍA EJEMPLO', 'personal'],
    ['Pago en ALIMENTACIÓN Y BAZAR', 'groceries'],
    ['Pago en KIWI.COM', 'travel'],
    ['Bizum Uber Eats', 'transfer'],
    ['Pago en COMERCIO BARCELONA', 'other'],
    ['Pago en COMERCIO 123', 'other']
  ];
  const snapshot = {
    from: date, to: date, balanceCents: 10000,
    transactions: examples.map(([note]) => ({ date, note, amountCents: -101 }))
  };
  const data = bankingMonth(snapshot, month);
  const dashboard = bankDashboard({ month, ...data });

  assert.deepEqual(dashboard.movements.map(item => [item.note, item.category.id]), examples);
  assert.equal(dashboard.categories.reduce((sum, category) => sum + category.debits, 0), data.summary.debits);
});

test('el flujo ajustado excluye aportaciones emitidas al destinatario configurado', () => {
  const recipient = 'Álex Persona Ejemplo';
  const month = '2026-10';
  const date = month + '-15';
  const transactions = [
    { date, amountCents: -12500, note: 'Transferencia emitida a ALEX PERSONA EJEMPLO Acciones' },
    { date, amountCents: -2500, note: 'Transferencia emitida a Otra persona' },
    { date, amountCents: 20000, note: 'Transferencia recibida de Alex Persona Ejemplo' },
    { date, amountCents: -1000, note: 'Bizum a Alex Persona Ejemplo' }
  ].map(item => ({ ...item, investmentTransfer: isInvestmentTransfer(item, recipient) }));
  const snapshot = { from: month + '-01', to: '2026-11-15', transactions };
  const october = bankingMonth(snapshot, month);
  const dashboard = bankDashboard({ month, ...october });
  assert.deepEqual(october.summary, { credits: 20000, debits: 16000 });
  assert.equal(dashboard.investmentDebits, 12500);
  assert.equal(dashboard.net, 16500);
  const november = bankDashboard({ month: '2026-11', ...bankingMonth(snapshot, '2026-11') });
  assert.equal(november.investmentDebits, 0);
});

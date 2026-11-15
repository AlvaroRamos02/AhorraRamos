export function salaryDate(year, month) {
  if (!Number.isInteger(year) || year < 1000 || year > 9999 || !Number.isInteger(month) || month < 1 || month > 12) throw new Error('Mes no válido');
  const date = new Date(Date.UTC(year, month, -1));
  const day = date.getUTCDay();
  if (day === 6) date.setUTCDate(date.getUTCDate() + 2);
  if (day === 0) date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function parseCents(value) {
  if (typeof value !== 'string' || !/^(?:0|[1-9]\d{0,9})(?:[.,]\d{1,2})?$/.test(value.trim())) throw new Error('Importe no válido');
  const [units, decimals = ''] = value.trim().replace(',', '.').split('.');
  const cents = Number(units) * 100 + Number(decimals.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents <= 0) throw new Error('El importe debe ser mayor que cero');
  return cents;
}

export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) throw new Error('Fecha no válida');
  return value;
}

export function summarize(accounts, transactions, month) {
  const balances = Object.fromEntries(accounts.map(a => [a.id, a.opening_cents]));
  let income = 0, expenses = 0, savedTransfer = 0;
  const byCategory = {};
  for (const t of transactions) {
    if (t.status !== 'confirmed') continue;
    const source = accounts.find(a => a.id === t.account_id);
    const destination = accounts.find(a => a.id === t.destination_id);
    const affectsSourceBalance = !source?.opening_date || t.date >= source.opening_date;
    const affectsDestinationBalance = !destination?.opening_date || t.date >= destination.opening_date;
    if (t.type === 'income' && affectsSourceBalance) balances[t.account_id] += t.amount_cents;
    if (t.type === 'expense' && affectsSourceBalance) balances[t.account_id] -= t.amount_cents;
    if (t.type === 'transfer') {
      if (affectsSourceBalance) balances[t.account_id] -= t.amount_cents;
      if (affectsDestinationBalance) balances[t.destination_id] += t.amount_cents;
      if (source?.kind !== 'savings' && destination?.kind === 'savings') savedTransfer += t.date.startsWith(month) ? t.amount_cents : 0;
      if (source?.kind === 'savings' && destination?.kind !== 'savings') savedTransfer -= t.date.startsWith(month) ? t.amount_cents : 0;
    }
    if (t.date.startsWith(month)) {
      if (t.type === 'income') income += t.amount_cents;
      if (t.type === 'expense') {
        expenses += t.amount_cents;
        byCategory[t.category_name || 'Sin categorizar'] = (byCategory[t.category_name || 'Sin categorizar'] || 0) + t.amount_cents;
      }
    }
  }
  return { balances, total: Object.values(balances).reduce((a,b) => a+b, 0), income, expenses, generatedSavings: income - expenses, savedTransfer, byCategory };
}

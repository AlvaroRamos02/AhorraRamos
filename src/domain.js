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

export function parseSignedCents(value) {
  if (typeof value !== 'string') throw new Error('Importe no válido');
  const negative = value.startsWith('-');
  const unsigned = negative ? value.slice(1) : value;
  if (/^0(?:[.,]0{1,2})?$/.test(unsigned)) return 0;
  const cents = parseCents(unsigned);
  return negative ? -cents : cents;
}

export function madridDate(daysAgo = 0, instant = new Date()) {
  const date = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(instant);
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() - daysAgo);
  return day.toISOString().slice(0, 10);
}

export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) throw new Error('Fecha no válida');
  return value;
}

export const bankingHistoryDays = 90;

const monthEnd = month => new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 0)).toISOString().slice(0, 10);

export function movementTotals(transactions) {
  let credits = 0;
  let debits = 0;
  for (const { amountCents } of transactions) {
    if (amountCents > 0) credits += amountCents;
    if (amountCents < 0) debits -= amountCents;
  }
  if (!Number.isSafeInteger(credits) || !Number.isSafeInteger(debits)) {
    throw new Error('El total supera el rango de importes admitido');
  }
  return { credits, debits };
}

function bankingPeriod(snapshot, lastSyncAt) {
  const syncedAt = new Date(lastSyncAt);
  return {
    from: snapshot.from ?? madridDate(bankingHistoryDays - 1, syncedAt),
    to: snapshot.to ?? madridDate(0, syncedAt)
  };
}

export function bankingMonth(snapshot, month, lastSyncAt) {
  if (!snapshot) return { balance: null, period: null, summary: null, transactions: [] };

  const period = bankingPeriod(snapshot, lastSyncAt);
  const { from, to } = period;
  const transactions = snapshot.transactions.filter(transaction =>
    transaction.date.startsWith(month) && transaction.date >= from && transaction.date <= to
  );
  const summary = month >= from.slice(0, 7) && month <= to.slice(0, 7)
    ? movementTotals(transactions)
    : null;

  return {
    balance: { cents: snapshot.balanceCents, kind: snapshot.balanceKind },
    period,
    summary,
    transactions
  };
}

const labels = {
  transfer: ['Transferencias y Bizum', 'violet', '↔'],
  salary: ['Nómina', 'mint', '↙'],
  groceries: ['Supermercado', 'mint', '▤'],
  dining: ['Restauración', 'peach', '◇'],
  transport: ['Transporte', 'blue', '↗'],
  travel: ['Viajes y alojamiento', 'blue', '✈'],
  housing: ['Vivienda y suministros', 'violet', '⌂'],
  health: ['Salud', 'pink', '+'],
  personal: ['Cuidado personal', 'pink', '✿'],
  leisure: ['Ocio y suscripciones', 'lavender', '✦'],
  sports: ['Deporte', 'mint', '◎'],
  gambling: ['Apuestas y juego', 'lavender', '♠'],
  shopping: ['Compras', 'blue', '□'],
  cash: ['Retiradas de efectivo', 'neutral', '↥'],
  taxes: ['Impuestos', 'peach', '§'],
  fees: ['Comisiones y financiación', 'peach', '%'],
  other: ['Sin clasificar', 'neutral', '·']
};

export const expenseCategories = Object.entries(labels)
  .filter(([id]) => id !== 'salary')
  .map(([id, [label]]) => ({ id, label }))
  .sort((a, b) => a.label.localeCompare(b.label, 'es'));

const categoryRules = [
  ['cash', /\b(?:extraccion|retirada|reintegro) (?:de efectivo|(?:en )?cajero)\b/],
  ['taxes', /\b(?:pago de impuestos|agencia tributaria|aeat)\b/],
  ['transfer', /\b(bizum|traspaso|transferencia|sepa transfer)\b/],
  ['gambling', /\b(?:bet ?365|codere|sportium|bwin|william hill|loterias y apuestas)\b/],
  ['groceries', /\b(mercadona|supermercados?|lidl|aldi|carrefour|alcampo|eroski|consum|hipercor|ahorramas|lupa numancia|alimentacion y bazar|frutos secos)\b/],
  ['dining', /\b(restaurantes?|cafeteria|pizzeria|glovo|deliveroo|burger king|mcdonald ?s?|just eat|uber eats|kebap|doner|montaditos|taberna|pub|delikia)\b|^bar /],
  ['dining', /\b(cafe del tren|cafe santander|la choco ii|aperitoche|sumo palacio|dr jekyll|los huevos de lucio|hundred madrid|room service pizze\w*)\b/],
  ['transport', /\b(transporte|renfe|metro|gasolinera|repsol|cepsa|taxi|uber|cabify|parking|peaje|crtm|easypark|autopistas|bolt eu\w*|e s arturo soria)\b/],
  ['travel', /\b(kiwi com|holafly|booking com|airbnb|trenmashotel)\b/],
  ['housing', /\b(alquiler|hipoteca|iberdrola|naturgy|endesa|movistar|vodafone|digi|orange espana)\b/],
  ['health', /\b(farmacia|fcia|clinica|dentista|sanitas|adeslas)\b/],
  ['personal', /\b(peluqueria|barberia)\b/],
  ['sports', /\b(playtomic|courtmaster|padel|diemar sport)\b/],
  ['leisure', /\b(netflix|spotify|disney|cine|hbo|steam|audible|cinesa|playstation|chatgpt|apple com ?bill|fourvenues)\b/],
  ['shopping', /\b(amazon|zara|ikea|decathlon|mediamarkt|el corte ingles|zalando|pull (?:and )?bear|massimo dutti|scuffers|kave santander|understreet market)\b/],
  ['fees', /\b(comision|comisiones|financiacion|prestamo)\b/]
];

export function normalizeConcept(note) {
  return note.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es-ES').trim().replace(/\s+/g, ' ');
}

export function isInvestmentTransfer({ note, amountCents }, recipient) {
  if (amountCents >= 0 || !recipient) return false;
  const prefix = 'transferencia emitida a ' + normalizeConcept(recipient);
  const concept = normalizeConcept(note);
  return concept.startsWith(prefix) && !/^[\p{L}\p{N}]/u.test(concept.slice(prefix.length));
}

function categoryOf({ note, amountCents, categoryOverride }) {
  const concept = normalizeConcept(note)
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/^pago en /, '')
    .trim();
  const automatic = amountCents > 0 && /\b(nomina|payroll)\b/.test(concept)
    ? 'salary'
    : categoryRules.find(([, pattern]) => pattern.test(concept))?.[0] ?? 'other';
  const id = amountCents < 0 && categoryOverride ? categoryOverride : automatic;
  const [label, tone, symbol] = labels[id];
  return { id, label, tone, symbol };
}

export function monthlyBankAnalysis(snapshot, month, today, lastSyncAt) {
  if (!snapshot) return { months: [], comparison: null };
  const { from, to } = bankingPeriod(snapshot, lastSyncAt);
  const months = [];
  for (let key = from.slice(0, 7); key && key <= to.slice(0, 7); key = offsetMonth(key, 1)) {
    const start = `${key}-01`;
    const end = monthEnd(key);
    months.push({
      month: key,
      from: start < from ? from : start,
      to: end > to ? to : end,
      partial: start < from || end > to,
      ...bankingMonth(snapshot, key, lastSyncAt).summary
    });
  }

  const current = months.find(entry => entry.month === month);
  const previous = months.find(entry => entry.month === offsetMonth(month, -1));
  if (!current || !previous || current.from !== `${month}-01` || previous.from !== `${previous.month}-01`) {
    return { months, comparison: null };
  }

  let currentTo = current.to;
  let previousTo = previous.to;
  if (month === today.slice(0, 7)) {
    const day = [currentTo.slice(-2), previousTo.slice(-2), today.slice(-2)].sort()[0];
    currentTo = `${month}-${day}`;
    previousTo = `${previous.month}-${day}`;
  } else if (current.partial || previous.partial) {
    return { months, comparison: null };
  }

  const categories = new Map();
  const range = (from, to, column) => {
    const transactions = snapshot.transactions.filter(item => item.date >= from && item.date <= to);
    for (const item of transactions) {
      if (item.amountCents >= 0) continue;
      const { id, label } = categoryOf(item);
      if (!categories.has(id)) categories.set(id, { id, label, current: 0, previous: 0 });
      categories.get(id)[column] -= item.amountCents;
    }
    return { from, to, ...movementTotals(transactions) };
  };
  const comparison = {
    current: range(current.from, currentTo, 'current'),
    previous: range(previous.from, previousTo, 'previous'),
    categories: [...categories.values()].sort((a, b) =>
      Math.abs(b.current - b.previous) - Math.abs(a.current - a.previous) || a.label.localeCompare(b.label, 'es')
    )
  };
  return { months, comparison };
}

export function bankDashboard({ month, period, summary, transactions }) {
  if (!summary) return null;

  const lastDay = Number(monthEnd(month).slice(-2));
  const first = period.from.startsWith(month) ? Number(period.from.slice(-2)) : 1;
  const last = period.to.startsWith(month) ? Number(period.to.slice(-2)) : lastDay;
  const days = Array.from({ length: last - first + 1 }, (_, index) => ({
    date: `${month}-${String(first + index).padStart(2, '0')}`,
    credits: 0,
    debits: 0
  }));
  const categories = new Map();
  let investmentDebits = 0;
  const movements = transactions.map(item => {
    const category = categoryOf(item);
    const day = days[Number(item.date.slice(-2)) - first];
    if (item.amountCents > 0) day.credits += item.amountCents;
    if (item.amountCents < 0) {
      day.debits -= item.amountCents;
      if (item.investmentTransfer) investmentDebits -= item.amountCents;
      if (!categories.has(category.id)) categories.set(category.id, { ...category, debits: 0, count: 0 });
      const group = categories.get(category.id);
      group.debits -= item.amountCents;
      group.count++;
    }
    return { ...item, category };
  });
  return {
    from: days[0].date,
    to: days.at(-1).date,
    days,
    averageDailyDebits: Math.round(summary.debits / days.length),
    movements,
    categories: [...categories.values()].sort((a, b) => b.debits - a.debits || a.label.localeCompare(b.label, 'es')),
    investmentDebits,
    net: summary.credits - (summary.debits - investmentDebits)
  };
}

const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', useGrouping: 'always' });
const compactEuros = new Intl.NumberFormat('es-ES', { notation: 'compact', maximumFractionDigits: 2 });
const shortDate = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeZone: 'UTC' });
const shortMonth = new Intl.DateTimeFormat('es-ES', { month: 'short', timeZone: 'UTC' });
const localDateTime = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Madrid' });

export function formatMoney(cents) {
  const digits = String(Math.abs(cents)).padStart(3, '0');
  return euros.format(`${cents < 0 ? '-' : ''}${digits.slice(0, -2)}.${digits.slice(-2)}`);
}

export const formatChartMoney = cents => compactEuros.format(cents / 100) + '\u00a0€';

export const formatDate = value => shortDate.format(new Date(value));
export const formatMonth = value => shortMonth.format(new Date(`${value}-01`));
export const formatSyncDate = value => localDateTime.format(new Date(value));

export function offsetMonth(month, offset) {
  const shifted = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)) - 1 + offset, 1));
  return shifted.getUTCFullYear() >= 1000 && shifted.getUTCFullYear() <= 9999
    ? shifted.toISOString().slice(0, 7)
    : null;
}

export function movementDirection(amountCents) {
  if (amountCents < 0) return 'debit';
  return amountCents > 0 ? 'credit' : 'zero';
}

const directionLabels = { debit: 'Cargos', credit: 'Abonos', zero: 'Importe cero' };

export function groupMovements(movements, by) {
  const groups = new Map();
  for (const item of movements) {
    let key, label;
    switch (by) {
      case 'date': key = item.date; label = formatDate(key); break;
      case 'direction': key = movementDirection(item.amountCents); label = directionLabels[key]; break;
      case 'concept': key = normalizeConcept(item.note); label = item.note; break;
      default: key = item.category.id; label = item.category.label;
    }
    if (!groups.has(key)) groups.set(key, { key, label, movements: [], credits: 0, debits: 0 });
    const group = groups.get(key);
    group.movements.push(item);
    if (item.amountCents > 0) group.credits += item.amountCents;
    if (item.amountCents < 0) group.debits -= item.amountCents;
  }
  return [...groups.values()];
}

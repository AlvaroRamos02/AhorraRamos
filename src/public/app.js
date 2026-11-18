import {
  bankDashboard, expenseCategories, formatDate, formatMoney, formatMonth, formatSyncDate, groupMovements,
  movementDirection, movementTotals, normalizeConcept, offsetMonth
} from './domain.js';

const $ = selector => document.querySelector(selector);
const month = $('#month');
const search = $('#search');
const direction = $('#direction');
const category = $('#category');
const groupBy = $('#group-by');
const categoryEditor = $('#category-editor');
const expenseCategory = $('#expense-category');
const categorySave = $('#category-save');
const categoryCancel = $('#category-cancel');
const controls = [search, direction, category, groupBy];
const percents = new Intl.NumberFormat('es-ES', { style: 'percent', maximumFractionDigits: 1 });
const integers = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 });

let state;
let dashboard;
let loadVersion = 0;
let editedExpense;

expenseCategory.append(new Option('Automática', ''));
for (const { id, label } of expenseCategories) expenseCategory.add(new Option(label, id));

async function api(url, data) {
  let response;
  let result;
  try {
    response = await fetch(url, data === undefined ? undefined : {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    result = await response.json();
  } catch {
    throw new Error('No se ha recibido una respuesta válida. Comprueba que el servidor local esté en marcha.');
  }
  if (!response.ok) throw new Error(result?.error || 'El servidor local no ha podido completar la solicitud.');
  return result;
}

function element(tag, text = '', className = '') {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}

function notice(text, error = false) {
  const node = $('#notice');
  node.textContent = text;
  node.classList.toggle('error', error);
  node.hidden = !text;
}

function countLabel(count) {
  return integers.format(count) + (count === 1 ? ' movimiento' : ' movimientos');
}

const numberWithSign = cents => (cents > 0 ? '+' : '') + formatMoney(cents);
const toneClass = tone => 'tone-' + tone;

function movementRow(item) {
  const kind = movementDirection(item.amountCents);
  const detail = element('div', '', 'transaction-info');
  const subtitle = element('small', formatDate(item.date) + ' · ' + item.category.label +
    (item.categoryOverride ? ' · Manual' : ''));
  detail.append(element('strong', item.note), subtitle);
  const symbol = element('span', item.category.symbol, 'movement-icon ' + toneClass(item.category.tone));
  symbol.setAttribute('aria-hidden', 'true');
  const row = element('li', '', 'list-row');
  row.append(symbol, detail, element('span', numberWithSign(item.amountCents), 'amount ' + kind));
  if (kind === 'debit' && item.id) {
    const edit = element('button', 'Cambiar categoría', 'category-edit');
    edit.type = 'button';
    edit.dataset.expenseId = item.id;
    edit.setAttribute('aria-label', 'Cambiar categoría de ' + item.note + ', ' + formatDate(item.date));
    edit.addEventListener('click', () => {
      editedExpense = item;
      expenseCategory.value = item.categoryOverride ?? '';
      $('#category-editor-movement').textContent = item.note + ' · ' + formatMoney(item.amountCents);
      $('#category-error').textContent = '';
      categoryEditor.showModal();
    });
    detail.append(edit);
  } else if (kind === 'debit') {
    detail.append(element('small', 'Edición pendiente de una referencia bancaria única'));
  }
  return row;
}

function movementRows(items) {
  const list = element('ul', '', 'ledger-list');
  for (const item of items) list.append(movementRow(item));
  return list;
}

function renderMovements() {
  const query = normalizeConcept(search.value);
  const items = dashboard?.movements ?? [];
  const filtered = items.filter(item =>
    (direction.value === 'all' || movementDirection(item.amountCents) === direction.value) &&
    (category.value === 'all' || item.category.id === category.value) &&
    normalizeConcept(item.note).includes(query)
  );
  const activeFilters = Boolean(query || direction.value !== 'all' || category.value !== 'all');
  $('#clear').hidden = !activeFilters;
  let description = dashboard ? countLabel(items.length) : '';
  if (activeFilters && dashboard) {
    const { credits, debits } = movementTotals(filtered);
    description = integers.format(filtered.length) + ' de ' + description +
      ' · Abonos ' + formatMoney(credits) + ' · Cargos ' + formatMoney(debits) +
      ' · Neto ' + numberWithSign(credits - debits);
  }
  $('#movement-count').textContent = description;
  const ledger = $('#movement-list');
  ledger.replaceChildren();

  if (!filtered.length) {
    const message = activeFilters && items.length ? 'Ningún movimiento coincide con los filtros.'
      : dashboard ? 'No hay movimientos en los días consultados de este mes.' : 'No hay datos bancarios para este mes.';
    ledger.append(element('p', message, 'empty'));
    return;
  }
  if (groupBy.value === 'none') {
    ledger.append(movementRows(filtered));
    return;
  }
  const groups = groupMovements(filtered, groupBy.value);
  for (const [index, group] of groups.entries()) {
    const details = element('details', '', 'movement-group');
    details.open = index === 0 || groups.length === 1;
    const heading = element('summary', '', 'group-heading');
    const name = element('span', '', 'group-name');
    name.append(element('strong', group.label), element('small', countLabel(group.movements.length)));
    const totals = element('span', '', 'group-totals');
    if (group.credits) totals.append(element('span', numberWithSign(group.credits), 'credit'));
    if (group.debits) totals.append(element('span', formatMoney(-group.debits), 'debit'));
    if (!group.credits && !group.debits) totals.append(element('span', formatMoney(0)));
    heading.append(name, totals);
    details.append(heading, movementRows(group.movements));
    ledger.append(details);
  }
}

function renderCategoryChart() {
  const entries = dashboard?.categories ?? [];
  const chart = $('#categories');
  chart.hidden = !entries.length;
  $('#category-empty').hidden = Boolean(entries.length);
  $('#category-empty').textContent = dashboard ? 'No hay cargos en los días consultados.' : 'El desglose aparecerá cuando haya cargos.';
  chart.replaceChildren();
  for (const entry of entries) {
    const ratio = entry.debits / state.summary.debits;
    const button = element('button', '', 'category-row ' + toneClass(entry.tone));
    button.type = 'button';
    const label = element('span', entry.label, 'category-label');
    const value = element('span', formatMoney(entry.debits), 'category-value');
    const track = element('span', '', 'category-track');
    const fill = element('span');
    fill.style.width = (ratio * 100) + '%';
    track.setAttribute('aria-hidden', 'true');
    track.append(fill);
    button.append(label, value, track, element('small', countLabel(entry.count)), element('small', percents.format(ratio), 'category-value'));
    button.addEventListener('click', () => {
      direction.value = 'debit';
      category.value = entry.id;
      search.value = '';
      renderMovements();
      category.focus({ preventScroll: true });
      $('#movimientos').scrollIntoView({ block: 'start' });
    });
    chart.append(button);
  }
}

function renderActivity() {
  const days = dashboard?.days ?? [];
  const average = $('#daily-average');
  average.hidden = !days.length;
  average.textContent = dashboard ? 'Media diaria de cargos: ' + formatMoney(dashboard.averageDailyDebits) +
    ' · ' + days.length + (days.length === 1 ? ' día consultado' : ' días consultados') : '';
  const maximum = Math.max(0, ...days.map(day => Math.max(day.credits, day.debits)));
  $('#activity').hidden = !maximum;
  $('#activity-empty').hidden = Boolean(maximum);
  $('#activity-empty').textContent = dashboard ? 'No hay abonos ni cargos en los días consultados.' : 'La actividad aparecerá al cargar datos bancarios.';
  if (!maximum) return;

  renderBarChart('chart', days.map((day, index) => {
    const showLabel = index === 0 || index === days.length - 1 || (index % 7 === 0 && index < days.length - 2);
    return { ...day, label: showLabel ? String(Number(day.date.slice(-2))) : '', period: formatDate(day.date) };
  }), maximum);
}

function renderBarChart(prefix, entries, maximum) {
  const ticks = maximum ? [maximum, Math.round(maximum / 2), 0] : [null, null, 0];
  $(`#${prefix}-scale`).replaceChildren(...ticks.map(value => element('span', value === null ? '' : formatMoney(value))));
  const chart = $(`#${prefix}-bars`);
  const axis = $(`#${prefix}-axis`);
  const data = $(`#${prefix}-data`);
  chart.replaceChildren();
  axis.replaceChildren();
  data.replaceChildren();
  for (const entry of entries) {
    const description = entry.period + ' · Abonos ' + formatMoney(entry.credits) + ' · Cargos ' + formatMoney(entry.debits);
    const bars = element('div', '', 'chart-day');
    bars.title = description;
    for (const [name, amount] of [['inflow', entry.credits], ['outflow', entry.debits]]) {
      const bar = element('span', '', 'bar ' + name);
      bar.style.height = (amount / (maximum || 1) * 100) + '%';
      bars.append(bar);
    }
    chart.append(bars);
    axis.append(element('span', entry.label));
    data.append(element('li', description));
  }
}

const dateRange = ({ from, to }) => formatDate(from) + ' – ' + formatDate(to);

function renderMonthlyAnalysis() {
  const { months = [], comparison } = state.monthly ?? {};
  const unavailable = 'Reinicia el servidor local para cargar el análisis mensual.';
  $('#monthly-chart').hidden = !months.length;
  $('#monthly-empty').hidden = Boolean(months.length);
  $('#monthly-empty').textContent = state.monthly ? 'La evolución aparecerá al cargar datos bancarios.' : unavailable;
  $('#monthly-partial').hidden = !months.some(entry => entry.partial);
  renderBarChart('monthly', months.map(entry => ({
    ...entry,
    label: formatMonth(entry.month) + (entry.partial ? '*' : ''),
    period: dateRange(entry) + (entry.partial ? ' (mes parcial)' : '')
  })), Math.max(0, ...months.map(entry => Math.max(entry.credits, entry.debits))));

  $('#comparison-table').hidden = !comparison;
  const empty = $('#comparison-empty');
  empty.hidden = Boolean(comparison);
  empty.textContent = months.length ? 'La consulta no cubre los días necesarios de ambos meses.'
    : state.monthly ? 'La comparación aparecerá al cargar datos bancarios.' : unavailable;
  const period = $('#comparison-period');
  const rows = $('#comparison-rows');
  rows.replaceChildren();
  period.textContent = '';
  if (!comparison) return;

  const { current, previous, categories } = comparison;
  period.textContent = dateRange(current) + ' frente a ' + dateRange(previous);
  $('#comparison-current').textContent = formatMonth(current.from.slice(0, 7));
  $('#comparison-previous').textContent = formatMonth(previous.from.slice(0, 7));
  const largestCategory = Math.max(1, ...categories.map(entry => Math.max(entry.current, entry.previous)));
  for (const [index, entry] of [{ label: 'Cargos totales', current: current.debits, previous: previous.debits }, ...categories].entries()) {
    const row = element('tr');
    const label = element('th', entry.label);
    label.scope = 'row';
    row.append(label);
    for (const column of ['current', 'previous']) {
      const cell = element('td', formatMoney(entry[column]));
      if (index > 0) {
        const bar = element('span', '', `comparison-bar ${column}`);
        bar.setAttribute('aria-hidden', 'true');
        bar.style.width = (entry[column] / largestCategory * 100) + '%';
        cell.append(bar);
      }
      row.append(cell);
    }
    row.append(element('td', numberWithSign(entry.current - entry.previous)));
    if (index === 0) row.className = 'comparison-total';
    rows.append(row);
  }
}

function render() {
  const { balance, banking, summary } = state;
  const { configured, connected, lastSyncAt, lastSyncError } = banking;
  month.value = state.month;
  month.disabled = false;
  $('#prev-month').disabled = !offsetMonth(state.month, -1);
  $('#next-month').disabled = !offsetMonth(state.month, 1);
  $('#coverage').textContent = dashboard
    ? 'Datos del ' + formatDate(dashboard.from) + ' al ' + formatDate(dashboard.to)
    : state.period ? 'Mes fuera del periodo consultado' : 'A la espera de la primera consulta bancaria';
  $('#salary-date').textContent = formatDate(state.salaryDate);
  $('#credits').textContent = summary ? formatMoney(summary.credits) : '—';
  $('#debits').textContent = summary ? formatMoney(summary.debits) : '—';
  $('#investment-debits').textContent = dashboard ? formatMoney(dashboard.investmentDebits) : '—';
  $('#net').textContent = dashboard ? numberWithSign(dashboard.net) : '—';
  $('#net').className = dashboard ? movementDirection(dashboard.net) : '';
  $('#credit-count').textContent = dashboard
    ? 'Entradas en cuenta · ' + countLabel(dashboard.movements.filter(item => item.amountCents > 0).length)
    : 'Entradas en cuenta';
  $('#debit-count').textContent = dashboard ? countLabel(dashboard.movements.filter(item => item.amountCents < 0).length) : 'Movimientos de salida';
  $('#balance-kind').textContent = balance
    ? balance.kind === 'booked' ? 'Último saldo contabilizado' : 'Último saldo disponible'
    : 'Último saldo bancario';
  $('#balance').textContent = balance ? formatMoney(balance.cents) : '—';
  const status = $('#connection-status');
  status.hidden = false;
  status.textContent = connected ? 'Conectada' : 'Sin conexión';
  status.classList.toggle('online', connected);
  $('#bank-status').textContent = [
    lastSyncAt && 'Última consulta: ' + formatSyncDate(lastSyncAt) + '.',
    lastSyncError || (!configured && (connected
      ? 'Revisa la configuración de Enable Banking y HTTPS local para actualizar ING.'
      : 'Configura Enable Banking y HTTPS local para conectar ING.'))
      || (!connected && 'Autoriza el acceso de solo lectura a tu cuenta.')
      || (!lastSyncAt && 'Pendiente de la primera consulta.')
  ].filter(Boolean).join(' ');
  $('#connect').hidden = !configured;
  $('#connect').textContent = connected ? 'Reconectar ING' : 'Conectar ING';
  $('#connect').className = connected ? 'quiet' : 'primary';
  $('#sync').hidden = !configured || !connected;
  $('#disconnect').hidden = !connected;

  const selected = category.value;
  category.replaceChildren(new Option('Todas las categorías', 'all'));
  const categories = new Map((dashboard?.movements ?? []).map(item => [item.category.id, item.category.label]));
  for (const [id, label] of [...categories].sort((a, b) => a[1].localeCompare(b[1], 'es'))) {
    category.add(new Option(label, id));
  }
  category.value = categories.has(selected) ? selected : 'all';
  controls.forEach(control => { control.disabled = !dashboard; });
  renderActivity();
  renderCategoryChart();
  renderMonthlyAnalysis();
  renderMovements();
}

async function load(requestedMonth = state?.month ?? '') {
  const version = ++loadVersion;
  try {
    const next = await api('/api/state?month=' + encodeURIComponent(requestedMonth));
    if (version !== loadVersion) return;
    if (typeof next.salaryDate !== 'string' || !Number.isFinite(Date.parse(next.salaryDate))) {
      throw new Error('El servidor local devolvió un resumen bancario incompatible.');
    }
    dashboard = bankDashboard(next);
    state = next;
    render();
  } catch (error) {
    if (version !== loadVersion) return;
    month.value = state?.month ?? '';
    throw error;
  }
}

const changeMonth = value => load(value).catch(error => notice(error.message, true));

function showView() {
  const hash = location.hash || '#resumen';
  const comparing = hash === '#comparativa';
  const comparison = $('#comparativa');
  const wasComparing = !comparison.hidden;
  comparison.hidden = !comparing;
  for (const selector of ['#overview', '#analisis', '#movimientos', '#coverage']) {
    $(selector).hidden = comparing;
  }
  $('#page-title').textContent = comparing ? 'Comparativa mensual' : 'Resumen bancario';
  $('.skip-link').href = comparing ? '#comparativa' : '#resumen';
  for (const link of document.querySelectorAll('.rail nav a')) {
    if (link.hash === hash) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
  if (wasComparing !== comparing) {
    const target = comparing ? $('#resumen') : document.getElementById(hash.slice(1));
    target?.scrollIntoView();
  }
}

categoryCancel.addEventListener('click', () => categoryEditor.close());
categoryEditor.addEventListener('cancel', event => {
  if (categorySave.disabled) event.preventDefault();
});
$('#category-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (categorySave.disabled || !editedExpense) return;
  const { id } = editedExpense;
  const editedMonth = state.month;
  const selected = expenseCategory.value || null;
  const errorMessage = $('#category-error');
  const status = $('#category-status');
  errorMessage.textContent = status.textContent = '';
  categorySave.disabled = categoryCancel.disabled = expenseCategory.disabled = true;
  try {
    await api('/api/movements/category', { id, category: selected });
  } catch (error) {
    errorMessage.textContent = error.message;
    expenseCategory.disabled = false;
    expenseCategory.focus();
    return;
  } finally {
    categorySave.disabled = categoryCancel.disabled = expenseCategory.disabled = false;
  }
  categoryEditor.close();
  try {
    await load(month.value);
    status.textContent = selected ? 'Categoría guardada.' : 'Clasificación automática restaurada.';
    if (state.month === editedMonth && month.value === editedMonth) {
      const edit = $('#movement-list [data-expense-id="' + id + '"]');
      const group = edit?.closest('details');
      if (group) group.open = true;
      (edit ?? search).focus({ preventScroll: true });
    }
  } catch {
    status.textContent = 'Categoría guardada. Recarga el panel para ver el cambio.';
  }
});

month.addEventListener('change', () => changeMonth(month.value));
for (const [id, offset] of [['#prev-month', -1], ['#next-month', 1]]) {
  $(id).addEventListener('click', () => {
    const next = offsetMonth(month.value || state.month, offset);
    if (next) {
      month.value = next;
      changeMonth(next);
    }
  });
}
for (const control of controls) control.addEventListener('input', renderMovements);
$('#clear').addEventListener('click', () => {
  search.value = '';
  direction.value = category.value = 'all';
  renderMovements();
  search.focus();
});

async function bankAction(work) {
  const buttons = document.querySelectorAll('.bank-actions button');
  buttons.forEach(button => { button.disabled = true; });
  notice('');
  try { await work(); }
  catch (error) { notice(error.message, true); }
  finally { buttons.forEach(button => { button.disabled = false; }); }
}

$('#connect').addEventListener('click', () => bankAction(async () => {
  const result = await api('/api/banking/ing/connect', {});
  location.assign(result.url);
}));
$('#sync').addEventListener('click', () => bankAction(async () => {
  try {
    await api('/api/banking/ing/sync', {});
    notice('Consulta bancaria actualizada.');
  } finally {
    await load(month.value);
  }
}));
$('#disconnect').addEventListener('click', () => {
  if (!window.confirm('¿Desconectar ING y borrar la consulta guardada y las categorías manuales?')) return;
  bankAction(async () => {
    const result = await api('/api/banking/ing/disconnect', {});
    search.value = '';
    direction.value = category.value = 'all';
    await load(month.value);
    if (result.revoked === false) notice('Consulta local borrada. Comprueba la revocación del permiso en ING.', true);
  });
});

const ingReturn = new URLSearchParams(location.search).get('ing');
if (ingReturn) history.replaceState({}, '', location.pathname);
window.addEventListener('hashchange', showView);
showView();
async function loadInitialPanel() {
  const retry = $('#retry-load');
  retry.disabled = true;
  try {
    await load();
  } catch (error) {
    $('#coverage').textContent = 'No se ha podido cargar la consulta bancaria';
    $('#movement-list').replaceChildren(element('p', 'Movimientos pendientes de cargar.', 'empty'));
    notice(error.message, true);
    retry.hidden = false;
    retry.disabled = false;
    return;
  }
  retry.hidden = true;
  notice('');
  const messages = new Map([
    ['connected', 'Cuenta ING conectada.'],
    ['cancelled', 'Autorización de ING cancelada o caducada.'],
    ['failed', 'No se ha podido conectar la cuenta ING.']
  ]);
  if (messages.has(ingReturn)) notice(messages.get(ingReturn), ingReturn !== 'connected');
}
$('#retry-load').addEventListener('click', loadInitialPanel);
loadInitialPanel();

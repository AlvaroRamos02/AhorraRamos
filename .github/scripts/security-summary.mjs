import { appendFileSync, readFileSync } from 'node:fs';

const scanners = {
  gitleaks: {
    title: 'Secretos (Gitleaks)',
    columns: ['Regla', 'Archivo', 'Línea', 'Commit o procedencia'],
    findings(report) {
      if (!Array.isArray(report)) throw new Error('Informe inválido');
      return report.map(({ RuleID, File, StartLine, Commit }) => [RuleID, File, StartLine, Commit?.slice(0, 12) || 'Copia actual']);
    }
  },
  'npm-audit': {
    title: 'Dependencias (npm audit)',
    columns: ['Paquete', 'Gravedad', 'Versiones afectadas', 'Aviso o dependencia de origen'],
    findings(report) {
      if (report.error || report.auditReportVersion !== 2 || !report.vulnerabilities || Array.isArray(report.vulnerabilities) ||
          typeof report.vulnerabilities !== 'object') throw new Error('Informe inválido');
      return Object.entries(report.vulnerabilities).flatMap(([name, { severity, range, via }]) =>
        via.map(advisory => {
          if (typeof advisory === 'string') return [name, severity, range, 'A través de ' + advisory];
          const id = advisory.url?.match(/\/(GHSA-[\w-]+)\/?$/i)?.[1];
          const description = [id, advisory.title].filter(Boolean).join(' · ');
          return [name, advisory.severity ?? severity, advisory.range ?? range, description];
        })
      );
    }
  },
  semgrep: {
    title: 'Análisis estático (Semgrep)',
    columns: ['Regla', 'Gravedad', 'Archivo', 'Línea'],
    findings(report) {
      if (!Array.isArray(report.results) || !Array.isArray(report.errors)) throw new Error('Informe inválido');
      return report.results.map(({ check_id, extra, path, start }) => [
        check_id, extra.severity, path, start.line
      ]);
    },
    incomplete: report => report.errors.length > 0,
    coverage: report => report.paths?.scanned?.length
  }
};

function cell(value) {
  const text = String(value ?? '—').replace(/\s+/gu, ' ').trim() || '—';
  // Encode punctuation so report text cannot add Markdown, HTML or table columns.
  return text.replace(/[\x21-\x2f\x3a-\x40\x5b-\x60\x7b-\x7e]/g, character => '&#' + character.charCodeAt(0) + ';');
}

const [scanner, ...reportPaths] = process.argv.slice(2);
const { title, columns, findings, incomplete, coverage } = scanners[scanner];
const row = cells => '| ' + cells.map(cell).join(' | ') + ' |';
const lines = ['## ' + title, '', row(columns), '| ' + columns.map(() => '---').join(' | ') + ' |'];
const emptyRow = message => row([message, ...columns.slice(1).map(() => '—')]);

let missingReports = 0;
let found = false;
let hasErrors = false;
let scannedFiles;
for (const reportPath of reportPaths) {
  try {
    const report = JSON.parse(readFileSync(reportPath, 'utf8'));
    const results = findings(report);
    found ||= results.length > 0;
    hasErrors ||= Boolean(incomplete?.(report));
    scannedFiles = coverage?.(report);
    for (const finding of results) lines.push(row(finding));
  } catch {
    missingReports++;
  }
}

if (!found) {
  const completed = !hasErrors && missingReports === 0 && process.env.SCAN_OUTCOME === 'success';
  lines.push(emptyRow(completed ? 'Sin hallazgos' : 'Sin resultados verificables'));
}
if (Number.isInteger(scannedFiles)) {
  lines.push('', 'Archivos analizados por Semgrep: ' + scannedFiles);
}
if (hasErrors || missingReports) {
  lines.push('', 'Faltan resultados o hubo errores de análisis. Revisa los pasos del trabajo.');
  process.exitCode = 1;
}

appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n\n');

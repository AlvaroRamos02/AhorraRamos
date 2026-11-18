import { appendFileSync, readFileSync } from 'node:fs';

const scanners = {
  gitleaks: {
    title: 'Secretos (Gitleaks)',
    columns: ['Regla', 'Archivo', 'Línea', 'Commit'],
    findings(report) {
      if (!Array.isArray(report)) throw new Error('Informe inválido');
      return report.map(({ RuleID, File, StartLine, Commit }) => [RuleID, File, StartLine, Commit?.slice(0, 12)]);
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
    title: 'Código JavaScript (Semgrep)',
    columns: ['Regla', 'Gravedad', 'Archivo', 'Línea'],
    findings(report) {
      if (!Array.isArray(report.results) || !Array.isArray(report.errors)) throw new Error('Informe inválido');
      return report.results.map(({ check_id, extra, path, start }) => [
        check_id, extra.severity, 'src/' + path.replace(/^(?:\.\/|\/?src\/)/, ''), start.line
      ]);
    },
    incomplete: report => report.errors.length > 0
  }
};

function cell(value) {
  const text = String(value ?? '—').replace(/\s+/gu, ' ').trim() || '—';
  // Encode punctuation so report text cannot add Markdown, HTML or table columns.
  return text.replace(/[\x21-\x2f\x3a-\x40\x5b-\x60\x7b-\x7e]/g, character => '&#' + character.charCodeAt(0) + ';');
}

const [scanner, reportPath] = process.argv.slice(2);
const { title, columns, findings, incomplete } = scanners[scanner];
const row = cells => '| ' + cells.map(cell).join(' | ') + ' |';
const lines = ['## ' + title, '', row(columns), '| ' + columns.map(() => '---').join(' | ') + ' |'];
const emptyRow = message => row([message, ...columns.slice(1).map(() => '—')]);

try {
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  const results = findings(report);
  const hasErrors = incomplete?.(report);
  if (results.length) {
    for (const finding of results) lines.push(row(finding));
  } else {
    const completed = !hasErrors && process.env.SCAN_OUTCOME === 'success';
    lines.push(emptyRow(completed ? 'Sin hallazgos' : 'Sin resultados verificables'));
  }
  if (hasErrors) {
    lines.push('', 'Semgrep informó de errores durante el análisis. La tabla puede estar incompleta.');
    process.exitCode = 1;
  }
} catch {
  lines.push(emptyRow('Informe no disponible'));
  lines.push('', 'Revisa el paso de análisis para ver el estado de la ejecución.');
  process.exitCode = 1;
}

appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n\n');

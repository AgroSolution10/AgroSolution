/**
 * Utilitários de exportação (web). Em plataformas sem DOM, são no-ops.
 */

/** Baixa um CSV (separador ';' + BOM, compatível com Excel BR). */
export function baixarCsv(
  nomeArquivo: string,
  cabecalho: string[],
  linhas: (string | number)[][],
): void {
  if (typeof document === 'undefined') return;

  const escapar = (v: string | number) => {
    const s = String(v ?? '');
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const conteudo = [cabecalho, ...linhas].map((l) => l.map(escapar).join(';')).join('\n');
  const blob = new Blob(['﻿' + conteudo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Abre uma janela de impressão com o HTML do relatório. O usuário escolhe
 * "Salvar como PDF" na própria caixa de impressão do navegador.
 */
export function imprimirRelatorio(titulo: string, corpoHtml: string): void {
  if (typeof window === 'undefined') return;
  const win = window.open('', '_blank');
  if (!win) return;

  win.document.write(`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${titulo}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #1B1F1A; padding: 32px; }
    h1 { color: #0F5132; font-size: 22px; margin: 0 0 4px; }
    .sub { color: #5E6A63; font-size: 13px; margin: 0 0 24px; }
    h2 { font-size: 15px; margin: 24px 0 8px; color: #1B1F1A; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #DDE4E0; }
    th { color: #5E6A63; text-transform: uppercase; font-size: 11px; letter-spacing: .3px; }
    td.num, th.num { text-align: right; }
    .cards { display: flex; gap: 12px; flex-wrap: wrap; }
    .card { flex: 1 1 140px; border: 1px solid #DDE4E0; border-radius: 8px; padding: 12px 14px; }
    .card .v { font-size: 18px; font-weight: 800; }
    .card .l { font-size: 11px; color: #5E6A63; text-transform: uppercase; }
    .pos { color: #1D6B43; } .neg { color: #B42318; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>${corpoHtml}</body>
</html>`);
  win.document.close();
  win.focus();
  win.print();
}

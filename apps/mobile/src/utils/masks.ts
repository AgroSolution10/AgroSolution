export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function maskCpfCnpj(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 11) return maskCpf(digits);
  return maskCnpj(digits);
}

export function maskCpf(value: string): string {
  const v = onlyDigits(value).slice(0, 11);
  if (v.length > 9) return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`;
  if (v.length > 6) return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`;
  if (v.length > 3) return `${v.slice(0, 3)}.${v.slice(3)}`;
  return v;
}

export function maskCnpj(value: string): string {
  const v = onlyDigits(value).slice(0, 14);
  if (v.length > 12) return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8, 12)}-${v.slice(12)}`;
  if (v.length > 8) return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8)}`;
  if (v.length > 5) return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5)}`;
  if (v.length > 2) return `${v.slice(0, 2)}.${v.slice(2)}`;
  return v;
}

/** Máscara de moeda (centavos): "15820" → "158,20"; "1234567" → "12.345,67". */
export function maskMoeda(value: string): string {
  const digitos = onlyDigits(value);
  if (!digitos) return '';
  const numero = parseInt(digitos, 10) / 100;
  return numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Número a partir de um texto em moeda BR ("1.234,56" → 1234.56). */
export function parseMoeda(value: string): number {
  const digitos = onlyDigits(value);
  return digitos ? parseInt(digitos, 10) / 100 : NaN;
}

/** Formata um número para o campo de moeda ("1234.5" → "1.234,50"). */
export function formatMoeda(numero: number): string {
  return numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Máscara decimal livre (não força centavos), padrão BR: ponto é separador de
 * milhar (removido) e vírgula é o decimal. Ex.: "1.500" → "1500"; "1.500,5" →
 * "1500,5"; "150,55" → "150,55". Mantém só a 1ª vírgula e até 2 casas.
 */
export function maskDecimal(value: string): string {
  let v = value.replace(/\./g, '').replace(/[^\d,]/g, '');
  const i = v.indexOf(',');
  if (i !== -1) {
    const inteiro = v.slice(0, i);
    const dec = v.slice(i + 1).replace(/,/g, '').slice(0, 2);
    v = `${inteiro},${dec}`;
  }
  return v;
}

/** Número a partir de um decimal BR ("1.500,5" → 1500.5). */
export function parseDecimal(value: string): number {
  const v = value.replace(/\./g, '').replace(',', '.');
  return v ? parseFloat(v) : NaN;
}

export function maskTelefone(value: string): string {
  const v = onlyDigits(value).slice(0, 11);
  if (v.length === 0) return '';
  if (v.length <= 2) return `(${v}`;
  if (v.length <= 6) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
  if (v.length <= 10) return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
  return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
}

/**
 * Preferências de notificação do usuário. Guardadas localmente (localStorage no
 * web) por enquanto — as notificações push em si chegam quando o app for nativo.
 * Mantido simples de propósito: não exige tabela nem migration.
 */

export type Preferencias = {
  alertasPreco: boolean;
  clima: boolean;
  mercado: boolean;
};

const PADRAO: Preferencias = { alertasPreco: true, clima: true, mercado: true };

function chave(usuarioKey: string): string {
  return `agrosolution:prefs:${usuarioKey}`;
}

function disponivel(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage;
}

export function lerPreferencias(usuarioKey: string): Preferencias {
  if (!disponivel()) return PADRAO;
  try {
    const bruto = window.localStorage.getItem(chave(usuarioKey));
    if (!bruto) return PADRAO;
    return { ...PADRAO, ...(JSON.parse(bruto) as Partial<Preferencias>) };
  } catch {
    return PADRAO;
  }
}

export function salvarPreferencias(usuarioKey: string, prefs: Preferencias): void {
  if (!disponivel()) return;
  try {
    window.localStorage.setItem(chave(usuarioKey), JSON.stringify(prefs));
  } catch {
    // ignora — preferência é best-effort
  }
}

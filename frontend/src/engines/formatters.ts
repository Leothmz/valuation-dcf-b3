export const fBRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL',
  minimumFractionDigits: 2, maximumFractionDigits: 2
});

/**
 * Valor monetário abreviado: `R$ 690,8 bi`, `R$ 583,8 mi`, `R$ 12,5 mil`.
 *
 * O nome sempre prometeu abreviação, mas a implementação era um alias de
 * `fBRL.format` — o card de EV da DCF exibia `R$ 690.769.356.620,44` a 11px no
 * mobile, ilegível como grandeza. Abaixo de mil não abrevia: aí os centavos
 * ainda importam.
 */
export function fShort(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  if (abs >= 1e9)  return `${sign}R$ ${fmt(abs / 1e9)} bi`;
  if (abs >= 1e6)  return `${sign}R$ ${fmt(abs / 1e6)} mi`;
  if (abs >= 1e3)  return `${sign}R$ ${fmt(abs / 1e3)} mil`;
  return fBRL.format(n);
}

export function fPct(n: number, dec = 2): string {
  return (n * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec
  }) + '%';
}

export function fShares(n: number): string {
  return n.toLocaleString('pt-BR');
}

export function fInputLL(n: number | null | undefined): string {
  if (n == null) return '';
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

export function fInputPctSigned(n: number | null | undefined): string {
  if (n == null) return '';
  const pct = n * 100;
  const sign = pct >= 0 ? '+' : '';
  return sign + pct.toLocaleString('pt-BR', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
}

export function fInputPct(n: number | null | undefined): string {
  if (n == null) return '';
  return (n * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
}

/** Percentual com sinal sempre visível: +26,3% / -4,1%. Zero conta como positivo. */
export function fPctSigned(n: number, dec = 2): string {
  const sign = n >= 0 ? '+' : '-';
  return sign + fPct(Math.abs(n), dec);
}

/** Número genérico pt-BR com casas decimais fixas; `—` para null/undefined. */
export function fNum(n: number | null | undefined, dec = 2): string {
  if (n == null) return '—';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

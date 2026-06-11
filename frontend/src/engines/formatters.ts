export const fBRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL',
  minimumFractionDigits: 2, maximumFractionDigits: 2
});

export function fShort(n: number): string {
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

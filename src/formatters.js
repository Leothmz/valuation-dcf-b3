export const fBRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL',
  minimumFractionDigits: 2, maximumFractionDigits: 2
});

export function fShort(n) {
  return fBRL.format(n);
}

export function fPct(n, dec = 2) {
  return (n * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec
  }) + '%';
}

export function fShares(n) {
  return n.toLocaleString('pt-BR');
}

export function fInputLL(n) {
  if (n == null) return '';
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

export function fInputPctSigned(n) {
  if (n == null) return '';
  const pct = n * 100;
  const sign = pct >= 0 ? '+' : '';
  return sign + pct.toLocaleString('pt-BR', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
}

export function fInputPct(n) {
  if (n == null) return '';
  return (n * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
}

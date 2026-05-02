export function growthRate(payout, roe) {
  return (1 - payout) * roe;
}

export function runDCF(assumptions, history, projYears, yearOverrides) {
  const a = assumptions;
  if (!a.ll || a.ll <= 0 || !a.disc || !a.perp || !a.shares) return null;
  if (a.perp >= a.disc) return { error: 'gordon' };

  const g = a.g ?? 0;
  const n = projYears;
  const currentYear = new Date().getFullYear();
  const baseYear = history.length ? history[0].year : currentYear - 1;

  const flows = [];
  let prevCF = a.ll;
  for (let i = 1; i <= n; i++) {
    const year = baseYear + i;
    let cf, actualG;
    if (yearOverrides[year] != null) {
      cf = yearOverrides[year];
      actualG = prevCF > 0 ? (cf / prevCF - 1) : 0;
    } else {
      cf = prevCF * (1 + g);
      actualG = g;
    }
    flows.push({ year, cf, g: actualG });
    prevCF = cf;
  }

  const pvFlows = flows.map((f, i) => ({
    ...f,
    pv: f.cf / Math.pow(1 + a.disc, i + 1)
  }));

  const lastCF = flows[n - 1].cf;
  const tvDenom = (1 + a.disc) / (1 + a.perp) - 1;
  const tv = lastCF / tvDenom;
  const pvTV = tv / Math.pow(1 + a.disc, n);
  const sumPV = pvFlows.reduce((acc, f) => acc + f.pv, 0);
  const ev = sumPV + pvTV;
  const fairPrice = ev / a.shares;
  const upside = a.price ? (fairPrice - a.price) / fairPrice : null;

  return { flows, pvFlows, tv, pvTV, sumPV, ev, fairPrice, upside, baseYear };
}

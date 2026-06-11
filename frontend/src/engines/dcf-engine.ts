export function growthRate(payout: number, roe: number): number {
  return (1 - payout) * roe;
}

export interface DCFAssumptions {
  ll: number
  payout?: number
  roe?: number
  g?: number           // override growth rate (optional)
  disc: number         // discount rate 0–1
  perp: number         // perpetuity growth rate 0–1
  perpDisc?: number    // discount rate used in Gordon denominator (defaults to disc)
  tvDisc?: number      // rate used to discount TV back to present (defaults to disc)
  shares: number       // number of shares
  price?: number       // current price
}

export interface DCFHistoryEntry {
  year: number
  value: number
}

export interface DCFFlow {
  year: number
  cf: number
  g: number
}

export interface DCFFlowPV extends DCFFlow {
  pv: number
}

export interface DCFGordonError {
  error: 'gordon'
}

export interface DCFResult {
  flows: DCFFlow[]
  pvFlows: DCFFlowPV[]
  tv: number
  pvTV: number
  sumPV: number
  ev: number
  fairPrice: number
  upside: number | null
  baseYear: number
}

export function runDCF(
  assumptions: DCFAssumptions,
  history: DCFHistoryEntry[],
  projYears: number,
  yearOverrides: Record<number, number>
): DCFResult | DCFGordonError | null {
  const a = assumptions;
  const perpDisc = a.perpDisc ?? a.disc;
  const tvDisc   = a.tvDisc   ?? a.disc;
  if (!a.ll || a.ll <= 0 || !a.disc || !a.perp || !a.shares) return null;
  if (a.perp >= perpDisc) return { error: 'gordon' };

  const g = a.g ?? 0;
  const n = projYears;
  const currentYear = new Date().getFullYear();
  const baseYear = history.length ? history[0].year : currentYear - 1;

  const flows: DCFFlow[] = [];
  let prevCF = a.ll;
  for (let i = 1; i <= n; i++) {
    const year = baseYear + i;
    let cf: number, actualG: number;
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

  const pvFlows: DCFFlowPV[] = flows.map((f, i) => ({
    ...f,
    pv: f.cf / Math.pow(1 + a.disc, i + 1)
  }));

  const lastCF = flows[n - 1].cf;
  const tvDenom = (1 + perpDisc) / (1 + a.perp) - 1;
  const tv = lastCF / tvDenom;
  const pvTV = tv / Math.pow(1 + tvDisc, n);
  const sumPV = pvFlows.reduce((acc, f) => acc + f.pv, 0);
  const ev = sumPV + pvTV;
  const fairPrice = ev / a.shares;
  const upside = a.price ? (fairPrice - a.price) / fairPrice : null;

  return { flows, pvFlows, tv, pvTV, sumPV, ev, fairPrice, upside, baseYear };
}

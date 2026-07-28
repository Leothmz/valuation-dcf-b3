export type FIIPerfil = 'risco' | 'crescimento' | 'ancoragem'

export interface FIIData {
  ticker: string
  dy?: number | null
  pvp?: number | null
  price?: number | null
  [key: string]: unknown
}

export interface RankedFII extends FIIData {
  _rankDY: number
  _rankPVP: number
  _scoreThomazFII: number
}

function _rankOrdinal(fiis: FIIData[], key: string, dir: 'asc' | 'desc'): Record<string, number> {
  const valid = fiis.filter(f => f[key] != null && !isNaN(f[key] as number));
  const sorted = [...valid].sort((a, b) =>
    dir === 'desc'
      ? (b[key] as number) - (a[key] as number)
      : (a[key] as number) - (b[key] as number)
  );
  const map: Record<string, number> = {};
  sorted.forEach((f, i) => { map[f.ticker] = i + 1; });
  return map;
}

export function calcThomazFIIScore(fiis: FIIData[]): RankedFII[] {
  if (fiis.length === 0) return [];
  const n   = fiis.length;
  const bad = n + 1;

  const rankDY  = _rankOrdinal(fiis, 'dy',  'desc'); // maior DY = rank 1
  const rankPVP = _rankOrdinal(fiis, 'pvp', 'asc');  // menor PVP = rank 1

  const scored = fiis.map(f => {
    const _rankDY    = rankDY[f.ticker]  ?? bad;
    const _rankPVP   = rankPVP[f.ticker] ?? bad;
    const _scoreThomazFII = _rankDY + _rankPVP;
    return { ...f, _rankDY, _rankPVP, _scoreThomazFII };
  });

  return scored.sort((a, b) => a._scoreThomazFII - b._scoreThomazFII);
}

export function classifyPerfil(pvp: number | null | undefined): FIIPerfil | null {
  if (pvp == null) return null;
  if (pvp <= 0.80) return 'risco';
  if (pvp <= 0.95) return 'crescimento';
  return 'ancoragem';
}

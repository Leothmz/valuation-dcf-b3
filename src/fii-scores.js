// src/fii-scores.js

function _rankOrdinal(fiis, key, dir) {
  const valid = fiis.filter(f => f[key] != null && !isNaN(f[key]));
  const sorted = [...valid].sort((a, b) =>
    dir === 'desc' ? b[key] - a[key] : a[key] - b[key]
  );
  const map = {};
  sorted.forEach((f, i) => { map[f.ticker] = i + 1; });
  return map;
}

export function calc2em1Score(fiis) {
  if (fiis.length === 0) return [];
  const n   = fiis.length;
  const bad = n + 1;

  const rankDY  = _rankOrdinal(fiis, 'dy',  'desc'); // maior DY = rank 1
  const rankPVP = _rankOrdinal(fiis, 'pvp', 'asc');  // menor PVP = rank 1

  const scored = fiis.map(f => {
    const _rankDY    = rankDY[f.ticker]  ?? bad;
    const _rankPVP   = rankPVP[f.ticker] ?? bad;
    const _score2em1 = _rankDY + _rankPVP;
    return { ...f, _rankDY, _rankPVP, _score2em1 };
  });

  return scored.sort((a, b) => a._score2em1 - b._score2em1);
}

export function classifyPerfil(pvp) {
  if (pvp == null) return null;
  if (pvp <= 0.80) return 'risco';
  if (pvp <= 0.95) return 'crescimento';
  return 'ancoragem';
}

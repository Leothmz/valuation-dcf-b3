function _rankMetric(stocks, key, dir) {
  const valid = stocks.filter(s => s[key] != null && !isNaN(s[key]));
  valid.sort((a, b) => dir === 'desc' ? b[key] - a[key] : a[key] - b[key]);
  const map = {};
  valid.forEach((s, i) => { map[s.ticker] = i + 1; });
  return map;
}

function _scoreFromRank(rank, n) {
  if (n < 2) return 50;
  return Math.round(100 * (1 - (rank - 1) / (n - 1)));
}

export function calcThomazScore(stocks, weights, watchlistMap = {}) {
  if (stocks.length === 0) return [];
  const w = weights;
  const totalW = Object.values(w).reduce((a, b) => a + b, 0) || 1;
  const n = stocks.length;

  const plPos      = stocks.filter(s => s.pl != null && s.pl > 0);
  const rankPL_map = _rankMetric(plPos, 'pl', 'asc');
  const rankDY     = _rankMetric(stocks, 'dy',                'desc');
  const rankML     = _rankMetric(stocks, 'margemLiquida',     'desc');
  const rankDE     = _rankMetric(stocks, 'dividaLiquidaEbit', 'asc');
  const rankROE    = _rankMetric(stocks, 'roe',               'desc');
  const rankROIC   = _rankMetric(stocks, 'roic',              'desc');

  return stocks.map(s => {
    const t   = s.ticker;
    const bad = n + 1;
    const rankPL = rankPL_map[t] || bad;

    const wr = (
      (rankDY[t]   || bad) * w.dy +
      rankPL               * w.pl +
      (rankML[t]   || bad) * w.margemLiquida +
      (rankDE[t]   || bad) * w.dividaLiquidaEbit +
      (rankROE[t]  || bad) * w.roe +
      (rankROIC[t] || bad) * w.roic
    ) / totalW;

    const score     = _scoreFromRank(wr, n + 1);
    const fairPrice = watchlistMap[t] ? watchlistMap[t].fairPrice : null;
    return { ...s, score, fairPrice };
  });
}

export function calcBazinScore(stocks, taxaBazin = 0.06) {
  if (stocks.length === 0) return [];
  const scored = stocks.map(s => {
    const fairPrice = s.dpa ? s.dpa / taxaBazin : null;
    const upside    = fairPrice ? (fairPrice - s.price) / fairPrice : null;
    return { ...s, fairPrice, _upside: upside };
  });
  const valid = scored.filter(s => s._upside != null);
  if (valid.length < 2) {
    return scored.map(s => ({ ...s, score: s._upside != null ? 50 : null }));
  }
  const rankMap = {};
  [...valid].sort((a, b) => b._upside - a._upside)
    .forEach((s, i) => { rankMap[s.ticker] = i + 1; });
  const nv = valid.length;
  return scored.map(s => ({
    ...s,
    score: rankMap[s.ticker] ? _scoreFromRank(rankMap[s.ticker], nv) : null,
  }));
}

export function calcGrahamScore(stocks, multiplier = 22.5) {
  if (stocks.length === 0) return [];
  return stocks.map(s => {
    const { lpa, vpa, pl, pvp, dy, margemLiquida, roe } = s;
    let fairPrice = null;
    if (lpa > 0 && vpa > 0) fairPrice = Math.sqrt(multiplier * lpa * vpa);

    let score = 0;
    if (pl  != null && pl  > 0 && pl  < 15)  score += 20;
    else if (pl != null && pl > 0 && pl < 25) score += 10;
    if (pvp != null && pvp > 0 && pvp < 1.5) score += 20;
    else if (pvp != null && pvp > 0 && pvp < 2.5) score += 10;
    if (pl != null && pvp != null && pl > 0 && pvp > 0 && pl * pvp < 22.5) score += 10;
    if (dy  != null && dy  > 0)                    score += 10;
    if (lpa != null && lpa > 0)                    score += 10;
    if (vpa != null && vpa > 0)                    score += 10;
    if (margemLiquida != null && margemLiquida > 0.05) score += 10;
    if (roe != null && roe > 0.15)                 score += 10;
    return { ...s, fairPrice, score };
  });
}

export function calcLynchScore(stocks) {
  if (stocks.length === 0) return [];
  return stocks.map(s => {
    const { lpa, pl, crescimentoLucros, margemLiquida, roe, pegRatio } = s;
    let fairPrice = null;
    if (lpa && crescimentoLucros > 0) {
      fairPrice = lpa * (crescimentoLucros * 100);
    }
    const peg = pegRatio ?? (pl && crescimentoLucros > 0 ? pl / (crescimentoLucros * 100) : null);
    let score = 0;
    if (peg != null) {
      if      (peg < 0.5) score += 50;
      else if (peg < 1.0) score += 35;
      else if (peg < 1.5) score += 20;
      else                score += 5;
    }
    if (crescimentoLucros != null && crescimentoLucros > 0.20) score += 20;
    else if (crescimentoLucros != null && crescimentoLucros > 0.10) score += 10;
    if (margemLiquida != null && margemLiquida > 0.10) score += 15;
    if (roe           != null && roe           > 0.20) score += 15;
    return { ...s, fairPrice, score, _peg: peg };
  });
}

export function calcJoelScore(stocks) {
  if (stocks.length === 0) return [];
  const n = stocks.length;
  const bad = n + 1;
  const plPos       = stocks.filter(s => s.pl != null && s.pl > 0);
  const rankEY_map  = _rankMetric(plPos, 'pl', 'asc');
  const rankROIC_map = _rankMetric(stocks, 'roic', 'desc');

  return stocks.map(s => {
    const rEY   = rankEY_map[s.ticker]   || bad;
    const rROIC = rankROIC_map[s.ticker] || bad;
    const combined = (rEY + rROIC) / 2;
    const score = _scoreFromRank(combined, n + 1);
    const earningsYield = (s.pl != null && s.pl > 0) ? (1 / s.pl) : null;
    return { ...s, score, fairPrice: null, _earningsYield: earningsYield };
  });
}

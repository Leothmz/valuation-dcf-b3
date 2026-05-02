import { describe, it, expect } from 'vitest';
import {
  calcThomazScore, calcBazinScore, calcGrahamScore,
  calcLynchScore, calcJoelScore
} from '../../src/ranking-scores.js';

const WEIGHTS = { dy: 2, pl: 2, margemLiquida: 1, dividaLiquidaEbit: 1, roe: 1, roic: 1 };

function stock(overrides) {
  return {
    ticker: 'TEST',
    price: 10,
    dy: 0.06, pl: 10, margemLiquida: 0.15, dividaLiquidaEbit: 2,
    roe: 0.20, roic: 0.15, dpa: 0.60, lpa: 1.0, vpa: 5.0,
    pvp: 2.0, crescimentoLucros: 0.15, pegRatio: null,
    ...overrides
  };
}

describe('calcThomazScore', () => {
  it('retorna array vazio para array vazio', () => {
    expect(calcThomazScore([], WEIGHTS)).toEqual([]);
  });
  it('retorna score e fairPrice em cada item', () => {
    const result = calcThomazScore([stock({ ticker: 'A' }), stock({ ticker: 'B' })], WEIGHTS);
    expect(result[0]).toHaveProperty('score');
    expect(result[0]).toHaveProperty('fairPrice');
  });
  it('score entre 0 e 100', () => {
    const stocks = [stock({ ticker: 'A' }), stock({ ticker: 'B', dy: 0.12 })];
    const result = calcThomazScore(stocks, WEIGHTS);
    result.forEach(s => {
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(100);
    });
  });
  it('stock com melhor DY recebe score maior', () => {
    const stocks = [
      stock({ ticker: 'BOM', dy: 0.15, pl: 8 }),
      stock({ ticker: 'RUIM', dy: 0.02, pl: 25 }),
    ];
    const result = calcThomazScore(stocks, WEIGHTS);
    const bom  = result.find(s => s.ticker === 'BOM');
    const ruim = result.find(s => s.ticker === 'RUIM');
    expect(bom.score).toBeGreaterThan(ruim.score);
  });
  it('usa watchlistMap para fairPrice', () => {
    const wl = { 'A': { fairPrice: 99.99 } };
    const result = calcThomazScore([stock({ ticker: 'A' })], WEIGHTS, wl);
    expect(result[0].fairPrice).toBe(99.99);
  });
  it('fairPrice null quando não está na watchlist', () => {
    const result = calcThomazScore([stock({ ticker: 'A' })], WEIGHTS, {});
    expect(result[0].fairPrice).toBeNull();
  });
});

describe('calcBazinScore', () => {
  it('retorna array vazio para array vazio', () => {
    expect(calcBazinScore([])).toEqual([]);
  });
  it('preço teto = dpa / taxaBazin', () => {
    const result = calcBazinScore([stock({ ticker: 'A', dpa: 0.60 })], 0.06);
    expect(result[0].fairPrice).toBeCloseTo(10.0);
  });
  it('fairPrice null quando dpa é null', () => {
    const result = calcBazinScore([stock({ ticker: 'A', dpa: null })]);
    expect(result[0].fairPrice).toBeNull();
  });
  it('stock com maior upside recebe score maior', () => {
    const stocks = [
      stock({ ticker: 'BARATO', dpa: 1.20, price: 10 }),
      stock({ ticker: 'CARO',   dpa: 0.30, price: 10 }),
    ];
    const result = calcBazinScore(stocks, 0.06);
    const barato = result.find(s => s.ticker === 'BARATO');
    const caro   = result.find(s => s.ticker === 'CARO');
    expect(barato.score).toBeGreaterThan(caro.score);
  });
});

describe('calcGrahamScore', () => {
  it('retorna array vazio para array vazio', () => {
    expect(calcGrahamScore([])).toEqual([]);
  });
  it('preço Graham = sqrt(mult * lpa * vpa)', () => {
    const result = calcGrahamScore([stock({ ticker: 'A', lpa: 1.0, vpa: 5.0 })], 22.5);
    expect(result[0].fairPrice).toBeCloseTo(Math.sqrt(22.5 * 1.0 * 5.0));
  });
  it('fairPrice null quando lpa <= 0', () => {
    const result = calcGrahamScore([stock({ ticker: 'A', lpa: -1, vpa: 5 })]);
    expect(result[0].fairPrice).toBeNull();
  });
  it('fairPrice null quando vpa <= 0', () => {
    const result = calcGrahamScore([stock({ ticker: 'A', lpa: 1, vpa: 0 })]);
    expect(result[0].fairPrice).toBeNull();
  });
  it('retorna score e fairPrice em cada item', () => {
    const result = calcGrahamScore([stock({ ticker: 'A' })]);
    expect(result[0]).toHaveProperty('score');
    expect(result[0]).toHaveProperty('fairPrice');
  });
});

describe('calcLynchScore', () => {
  it('retorna array vazio para array vazio', () => {
    expect(calcLynchScore([])).toEqual([]);
  });
  it('retorna score e fairPrice em cada item', () => {
    const result = calcLynchScore([stock({ ticker: 'A' })]);
    expect(result[0]).toHaveProperty('score');
    expect(result[0]).toHaveProperty('fairPrice');
  });
  it('PEG < 0.5 recebe score maior que PEG > 1.5', () => {
    const stocks = [
      stock({ ticker: 'BOM',  pl: 5,  crescimentoLucros: 0.50, pegRatio: 0.1 }),
      stock({ ticker: 'RUIM', pl: 30, crescimentoLucros: 0.05, pegRatio: 6.0 }),
    ];
    const result = calcLynchScore(stocks);
    const bom  = result.find(s => s.ticker === 'BOM');
    const ruim = result.find(s => s.ticker === 'RUIM');
    expect(bom.score).toBeGreaterThan(ruim.score);
  });
});

describe('calcJoelScore', () => {
  it('retorna array vazio para array vazio', () => {
    expect(calcJoelScore([])).toEqual([]);
  });
  it('fairPrice sempre null (Joel não gera preço teto)', () => {
    const result = calcJoelScore([stock({ ticker: 'A' }), stock({ ticker: 'B' })]);
    result.forEach(s => expect(s.fairPrice).toBeNull());
  });
  it('retorna score em cada item', () => {
    const result = calcJoelScore([stock({ ticker: 'A' })]);
    expect(result[0]).toHaveProperty('score');
  });
  it('stock com menor PL e maior ROIC recebe score maior', () => {
    const stocks = [
      stock({ ticker: 'BOM',  pl: 5,  roic: 0.25 }),
      stock({ ticker: 'RUIM', pl: 30, roic: 0.02 }),
    ];
    const result = calcJoelScore(stocks);
    const bom  = result.find(s => s.ticker === 'BOM');
    const ruim = result.find(s => s.ticker === 'RUIM');
    expect(bom.score).toBeGreaterThan(ruim.score);
  });
});

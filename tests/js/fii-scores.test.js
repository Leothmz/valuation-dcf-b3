import { describe, it, expect } from 'vitest';
import { calc2em1Score, classifyPerfil } from '../../src/fii-scores.js';

function fii(overrides) {
  return { ticker: 'TEST', dy: 0.08, pvp: 0.90, price: 100, ...overrides };
}

describe('calc2em1Score', () => {
  it('retorna array vazio para input vazio', () => {
    expect(calc2em1Score([])).toEqual([]);
  });

  it('FII com maior DY e menor PVP fica em primeiro', () => {
    const fiis = [
      fii({ ticker: 'A', dy: 0.10, pvp: 0.90 }),
      fii({ ticker: 'B', dy: 0.12, pvp: 0.78 }), // melhor DY e menor PVP
      fii({ ticker: 'C', dy: 0.07, pvp: 1.00 }),
    ];
    const result = calc2em1Score(fiis);
    expect(result[0].ticker).toBe('B');
  });

  it('ordena do menor score para o maior', () => {
    const fiis = [
      fii({ ticker: 'A', dy: 0.08, pvp: 0.90 }),
      fii({ ticker: 'B', dy: 0.12, pvp: 0.78 }),
    ];
    const result = calc2em1Score(fiis);
    expect(result[0]._score2em1).toBeLessThanOrEqual(result[1]._score2em1);
  });

  it('FII sem DY recebe rank penalizado (n+1)', () => {
    const fiis = [
      fii({ ticker: 'A', dy: 0.10, pvp: 0.90 }),
      fii({ ticker: 'B', dy: null, pvp: 0.70 }),
    ];
    const result = calc2em1Score(fiis);
    const b = result.find(f => f.ticker === 'B');
    expect(b._rankDY).toBe(3); // n+1 = 2+1
  });

  it('FII sem PVP recebe rank penalizado (n+1)', () => {
    const fiis = [
      fii({ ticker: 'A', dy: 0.10, pvp: 0.90 }),
      fii({ ticker: 'B', dy: 0.12, pvp: null }),
    ];
    const result = calc2em1Score(fiis);
    const b = result.find(f => f.ticker === 'B');
    expect(b._rankPVP).toBe(3);
  });

  it('preserva todos os campos originais do FII', () => {
    const fiis = [fii({ ticker: 'A', name: 'Test FII', segmento: 'Logística' })];
    const result = calc2em1Score(fiis);
    expect(result[0].name).toBe('Test FII');
    expect(result[0].segmento).toBe('Logística');
  });

  it('adiciona campos _rankDY, _rankPVP, _score2em1', () => {
    const result = calc2em1Score([fii({ ticker: 'A' })]);
    expect(result[0]).toHaveProperty('_rankDY');
    expect(result[0]).toHaveProperty('_rankPVP');
    expect(result[0]).toHaveProperty('_score2em1');
  });

  it('score2em1 = rankDY + rankPVP', () => {
    const fiis = [
      fii({ ticker: 'A', dy: 0.12, pvp: 0.80 }),
      fii({ ticker: 'B', dy: 0.08, pvp: 0.95 }),
    ];
    const result = calc2em1Score(fiis);
    const a = result.find(f => f.ticker === 'A');
    expect(a._score2em1).toBe(a._rankDY + a._rankPVP);
  });
});

describe('classifyPerfil', () => {
  it('risco para pvp <= 0.80', () => {
    expect(classifyPerfil(0.80)).toBe('risco');
    expect(classifyPerfil(0.60)).toBe('risco');
  });

  it('crescimento para 0.81 <= pvp <= 0.95', () => {
    expect(classifyPerfil(0.81)).toBe('crescimento');
    expect(classifyPerfil(0.90)).toBe('crescimento');
    expect(classifyPerfil(0.95)).toBe('crescimento');
  });

  it('ancoragem para pvp > 0.95', () => {
    expect(classifyPerfil(0.96)).toBe('ancoragem');
    expect(classifyPerfil(1.10)).toBe('ancoragem');
  });

  it('null para pvp null ou undefined', () => {
    expect(classifyPerfil(null)).toBeNull();
    expect(classifyPerfil(undefined)).toBeNull();
  });
});

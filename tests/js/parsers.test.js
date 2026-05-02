import { describe, it, expect } from 'vitest';
import { parsePct, parseLL } from '../../src/parsers.js';

describe('parsePct', () => {
  it('converte "10" para 0.10', () => {
    expect(parsePct('10')).toBeCloseTo(0.10);
  });
  it('aceita vírgula como decimal', () => {
    expect(parsePct('10,5')).toBeCloseTo(0.105);
  });
  it('interpreta ponto como separador de milhar (pt-BR)', () => {
    expect(parsePct('10.5')).toBeCloseTo(1.05);  // "10.5" → "105" → 1.05
  });
  it('retorna null para string vazia', () => {
    expect(parsePct('')).toBeNull();
  });
  it('retorna null para null', () => {
    expect(parsePct(null)).toBeNull();
  });
});

describe('parseLL', () => {
  it('parseia número puro', () => {
    expect(parseLL('367766000')).toBe(367766000);
  });
  it('parseia número com pontos (formato pt-BR)', () => {
    expect(parseLL('367.766.000')).toBe(367766000);
  });
  it('parseia sufixo M', () => {
    expect(parseLL('367M')).toBe(367e6);
  });
  it('parseia sufixo m (minúsculo)', () => {
    expect(parseLL('367m')).toBe(367e6);
  });
  it('parseia sufixo B com vírgula', () => {
    expect(parseLL('0,37B')).toBeCloseTo(370e6);
  });
  it('parseia sufixo K', () => {
    expect(parseLL('500K')).toBe(500e3);
  });
  it('retorna null para string vazia', () => {
    expect(parseLL('')).toBeNull();
  });
  it('retorna null para valor inválido', () => {
    expect(parseLL('abc')).toBeNull();
  });
});

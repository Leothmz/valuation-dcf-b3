import { describe, it, expect } from 'vitest';
import { fBRL, fShort, fPct, fShares, fInputLL, fInputPctSigned, fInputPct } from '../../src/formatters.js';

describe('fBRL', () => {
  it('formata número com separadores pt-BR', () => {
    expect(fBRL.format(1234567.89)).toContain('1.234.567,89');
  });
  it('formata zero', () => {
    expect(fBRL.format(0)).toContain('0,00');
  });
});

describe('fShort', () => {
  it('é wrapper de fBRL.format', () => {
    expect(fShort(1000)).toBe(fBRL.format(1000));
  });
});

describe('fPct', () => {
  it('converte decimal para porcentagem com 2 casas', () => {
    expect(fPct(0.1234)).toBe('12,34%');
  });
  it('aceita dec personalizado', () => {
    expect(fPct(0.1, 1)).toBe('10,0%');
  });
  it('funciona com zero', () => {
    expect(fPct(0)).toBe('0,00%');
  });
});

describe('fInputLL', () => {
  it('retorna string vazia para null', () => {
    expect(fInputLL(null)).toBe('');
  });
  it('formata sem casas decimais', () => {
    expect(fInputLL(1234567)).toContain('1.234.567');
  });
});

describe('fInputPct', () => {
  it('retorna string vazia para null', () => {
    expect(fInputPct(null)).toBe('');
  });
  it('converte 0.15 para "15,00"', () => {
    expect(fInputPct(0.15)).toBe('15,00');
  });
});

describe('fInputPctSigned', () => {
  it('retorna string vazia para null', () => {
    expect(fInputPctSigned(null)).toBe('');
  });
  it('positivo recebe sinal +', () => {
    expect(fInputPctSigned(0.10)).toBe('+10,00');
  });
  it('negativo recebe sinal -', () => {
    expect(fInputPctSigned(-0.05)).toBe('-5,00');
  });
});

describe('fShares', () => {
  it('formata número sem casas decimais', () => {
    expect(fShares(1000000)).toContain('1.000.000');
  });
});

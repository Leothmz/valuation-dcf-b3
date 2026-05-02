import { describe, it, expect } from 'vitest';
import { growthRate, runDCF } from '../../src/dcf-engine.js';

const BASE_ASSUMPTIONS = {
  ll: 1_000_000,
  disc: 0.15,
  perp: 0.03,
  g: 0.10,
  shares: 100_000,
  price: 50,
};
const BASE_HISTORY = [{ year: 2023, value: 1_000_000 }];

describe('growthRate', () => {
  it('calcula (1 - payout) * roe', () => {
    expect(growthRate(0.4, 0.20)).toBeCloseTo(0.12);
  });
  it('retorna 0 quando payout é 1', () => {
    expect(growthRate(1, 0.20)).toBe(0);
  });
  it('retorna roe quando payout é 0', () => {
    expect(growthRate(0, 0.20)).toBe(0.20);
  });
});

describe('runDCF — inputs inválidos', () => {
  it('retorna null quando ll é 0', () => {
    const r = runDCF({ ...BASE_ASSUMPTIONS, ll: 0 }, BASE_HISTORY, 5, {});
    expect(r).toBeNull();
  });
  it('retorna null quando ll é negativo', () => {
    const r = runDCF({ ...BASE_ASSUMPTIONS, ll: -100 }, BASE_HISTORY, 5, {});
    expect(r).toBeNull();
  });
  it('retorna null quando shares é null', () => {
    const r = runDCF({ ...BASE_ASSUMPTIONS, shares: null }, BASE_HISTORY, 5, {});
    expect(r).toBeNull();
  });
  it('retorna {error:"gordon"} quando perp >= disc', () => {
    const r = runDCF({ ...BASE_ASSUMPTIONS, perp: 0.15 }, BASE_HISTORY, 5, {});
    expect(r).toMatchObject({ error: 'gordon' });
  });
});

describe('runDCF — projeção', () => {
  it('gera 3 fluxos quando projYears=3', () => {
    const r = runDCF(BASE_ASSUMPTIONS, BASE_HISTORY, 3, {});
    expect(r.flows).toHaveLength(3);
  });
  it('gera 5 fluxos quando projYears=5', () => {
    const r = runDCF(BASE_ASSUMPTIONS, BASE_HISTORY, 5, {});
    expect(r.flows).toHaveLength(5);
  });
  it('primeiro ano de projeção = baseYear + 1', () => {
    const r = runDCF(BASE_ASSUMPTIONS, BASE_HISTORY, 3, {});
    expect(r.flows[0].year).toBe(2024);
  });
  it('CF do ano 1 = ll * (1 + g)', () => {
    const r = runDCF(BASE_ASSUMPTIONS, BASE_HISTORY, 3, {});
    expect(r.flows[0].cf).toBeCloseTo(1_100_000);
  });
  it('fairPrice com valores conhecidos', () => {
    // Premissas: ll=1M, disc=0.15, perp=0.03, g=0.10, shares=100k, projYears=3
    // Resultado calculado manualmente: ~102.58
    const r = runDCF(BASE_ASSUMPTIONS, BASE_HISTORY, 3, {});
    expect(r.fairPrice).toBeCloseTo(102.58, 1);
  });
  it('yearOverride sobrescreve CF do ano', () => {
    const overrides = { 2024: 2_000_000 };
    const r = runDCF(BASE_ASSUMPTIONS, BASE_HISTORY, 3, overrides);
    expect(r.flows[0].cf).toBe(2_000_000);
  });
  it('yearOverride propaga para anos seguintes', () => {
    const overrides = { 2024: 2_000_000 };
    const r = runDCF(BASE_ASSUMPTIONS, BASE_HISTORY, 3, overrides);
    // Ano 2025 = 2_000_000 * 1.10 (sem override)
    expect(r.flows[1].cf).toBeCloseTo(2_200_000);
  });
});

describe('runDCF — fórmulas financeiras', () => {
  it('PV de cada fluxo = cf / (1+disc)^i', () => {
    const r = runDCF(BASE_ASSUMPTIONS, BASE_HISTORY, 3, {});
    const expectedPV1 = 1_100_000 / Math.pow(1.15, 1);
    expect(r.pvFlows[0].pv).toBeCloseTo(expectedPV1);
  });
  it('TV = lastCF / ((1+disc)/(1+perp) - 1)', () => {
    const r = runDCF(BASE_ASSUMPTIONS, BASE_HISTORY, 3, {});
    const lastCF = r.flows[2].cf;
    const expectedTV = lastCF / ((1.15 / 1.03) - 1);
    expect(r.tv).toBeCloseTo(expectedTV);
  });
  it('pvTV = TV / (1+disc)^n — usa disc, não g', () => {
    const r = runDCF(BASE_ASSUMPTIONS, BASE_HISTORY, 3, {});
    const expectedPvTV = r.tv / Math.pow(1.15, 3);
    expect(r.pvTV).toBeCloseTo(expectedPvTV);
  });
  it('ev = sumPV + pvTV', () => {
    const r = runDCF(BASE_ASSUMPTIONS, BASE_HISTORY, 3, {});
    expect(r.ev).toBeCloseTo(r.sumPV + r.pvTV);
  });
  it('upside = (fairPrice - price) / fairPrice', () => {
    const r = runDCF(BASE_ASSUMPTIONS, BASE_HISTORY, 3, {});
    const expected = (r.fairPrice - 50) / r.fairPrice;
    expect(r.upside).toBeCloseTo(expected);
  });
});

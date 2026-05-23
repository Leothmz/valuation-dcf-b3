// tests/js/portfolio-store.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'

const _store = {}
vi.stubGlobal('localStorage', {
  getItem:    (k) => _store[k] ?? null,
  setItem:    (k, v) => { _store[k] = v },
  removeItem: (k) => { delete _store[k] },
  clear:      () => { Object.keys(_store).forEach(k => delete _store[k]) },
})
vi.stubGlobal('crypto', { randomUUID: () => Math.random().toString(36).slice(2) })

import {
  getOperations, saveOperation, deleteOperation,
  getFixedIncome, saveFixedIncomeTitle, deleteFixedIncomeTitle,
  addDeposit, deleteDeposit, generateId
} from '../../src/portfolio-store.js'

beforeEach(() => localStorage.clear())

describe('getOperations', () => {
  it('returns empty array when nothing stored', () => {
    expect(getOperations()).toEqual([])
  })
  it('returns stored operations', () => {
    const op = { id: '1', ticker: 'WEGE3', type: 'buy', qty: 100, price: 34.20 }
    saveOperation(op)
    expect(getOperations()).toHaveLength(1)
    expect(getOperations()[0].ticker).toBe('WEGE3')
  })
})

describe('saveOperation', () => {
  it('adds new operation', () => {
    saveOperation({ id: 'a', ticker: 'WEGE3' })
    expect(getOperations()).toHaveLength(1)
  })
  it('updates existing operation by id', () => {
    saveOperation({ id: 'a', ticker: 'WEGE3', qty: 100 })
    saveOperation({ id: 'a', ticker: 'WEGE3', qty: 200 })
    const ops = getOperations()
    expect(ops).toHaveLength(1)
    expect(ops[0].qty).toBe(200)
  })
})

describe('deleteOperation', () => {
  it('removes operation by id', () => {
    saveOperation({ id: 'a', ticker: 'WEGE3' })
    deleteOperation('a')
    expect(getOperations()).toHaveLength(0)
  })
})

describe('fixed income titles', () => {
  it('saves and retrieves a title', () => {
    saveFixedIncomeTitle({ id: 't1', name: 'CDB Nubank', deposits: [] })
    expect(getFixedIncome()[0].name).toBe('CDB Nubank')
  })
  it('deletes a title by id', () => {
    saveFixedIncomeTitle({ id: 't1', name: 'CDB', deposits: [] })
    deleteFixedIncomeTitle('t1')
    expect(getFixedIncome()).toHaveLength(0)
  })
})

describe('addDeposit / deleteDeposit', () => {
  it('adds deposit to existing title', () => {
    saveFixedIncomeTitle({ id: 't1', name: 'CDB', deposits: [] })
    addDeposit('t1', { id: 'd1', amount: 10000, date: '2024-01-15' })
    expect(getFixedIncome()[0].deposits).toHaveLength(1)
  })
  it('deletes deposit from title', () => {
    saveFixedIncomeTitle({ id: 't1', name: 'CDB', deposits: [{ id: 'd1', amount: 10000 }] })
    deleteDeposit('t1', 'd1')
    expect(getFixedIncome()[0].deposits).toHaveLength(0)
  })
})

describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateId()).toBe('string')
    expect(generateId().length).toBeGreaterThan(0)
  })
  it('generates unique ids', () => {
    expect(generateId()).not.toBe(generateId())
  })
})

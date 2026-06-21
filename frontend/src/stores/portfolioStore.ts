import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type AssetClass = 'acao_br' | 'fii' | 'etf' | 'stock_intl' | 'cripto'
export type Category = 'acoes_br' | 'fiis' | 'renda_fixa' | 'internacional' | 'criptoativos' | 'caixa'
export const CATEGORIES: Category[] = [
  'acoes_br',
  'fiis',
  'renda_fixa',
  'internacional',
  'criptoativos',
  'caixa',
]

export type OperationType = 'buy' | 'sell'
export type RFRateType = 'cdi_pct' | 'ipca_plus' | 'prefixado' | 'manual'
export type RFType = 'cdb' | 'lci' | 'lca' | 'cri' | 'cra' | 'debenture' | 'tesouro' | 'outro'

export interface Operation {
  id: string
  date: string // YYYY-MM-DD
  ticker: string
  assetClass: AssetClass
  type: OperationType
  qty: number
  price: number
  currency: string
  fees: number
}

export interface RFDeposit {
  id: string
  date: string
  amount: number
  rateOverride: number | null
  manualCurrentValue: number | null
}

export interface RFTitle {
  id: string
  name: string
  type: RFType
  rateType: RFRateType
  baseRate: number
  maturityDate: string | null
  deposits: RFDeposit[]
}

export type ProventoType =
  | 'dividendo'
  | 'jcp'
  | 'rendimento'
  | 'reembolso'
  | 'fracao'
  | 'bonificacao'
  | 'outro'

export interface Provento {
  id: string
  date: string
  ticker: string
  type: ProventoType
  qty: number
  valuePerShare: number
}

function emptyAllocationTargets(): Record<Category, number> {
  return {
    acoes_br: 0,
    fiis: 0,
    renda_fixa: 0,
    internacional: 0,
    criptoativos: 0,
    caixa: 0,
  }
}

export interface PortfolioState {
  operations: Operation[]
  fixedIncome: RFTitle[]
  proventos: Provento[]
  cashBalance: number
  allocationTargets: Record<Category, number>
}

export interface PortfolioActions {
  addOperation: (op: Operation) => void
  deleteOperation: (id: string) => void
  addFixedIncomeTitle: (title: RFTitle) => void
  deleteFixedIncomeTitle: (id: string) => void
  addDeposit: (titleId: string, deposit: RFDeposit) => void
  deleteDeposit: (titleId: string, depositId: string) => void
  addProvento: (p: Provento) => void
  deleteProvento: (id: string) => void
  importOperations: (ops: Operation[]) => void
  importProventos: (provs: Provento[]) => void
  setCashBalance: (amount: number) => void
  setAllocationTarget: (category: Category, pct: number) => void
}

export const usePortfolioStore = create<PortfolioState & PortfolioActions>()(
  persist(
    (set) => ({
      operations: [],
      fixedIncome: [],
      proventos: [],
      cashBalance: 0,
      allocationTargets: emptyAllocationTargets(),

      addOperation: (op) =>
        set((s) => ({ operations: [...s.operations, op] })),

      deleteOperation: (id) =>
        set((s) => ({ operations: s.operations.filter((o) => o.id !== id) })),

      addFixedIncomeTitle: (title) =>
        set((s) => ({ fixedIncome: [...s.fixedIncome, title] })),

      deleteFixedIncomeTitle: (id) =>
        set((s) => ({ fixedIncome: s.fixedIncome.filter((t) => t.id !== id) })),

      addDeposit: (titleId, deposit) =>
        set((s) => ({
          fixedIncome: s.fixedIncome.map((t) =>
            t.id === titleId ? { ...t, deposits: [...t.deposits, deposit] } : t
          ),
        })),

      deleteDeposit: (titleId, depositId) =>
        set((s) => ({
          fixedIncome: s.fixedIncome.map((t) =>
            t.id === titleId
              ? { ...t, deposits: t.deposits.filter((d) => d.id !== depositId) }
              : t
          ),
        })),

      addProvento: (p) =>
        set((s) => ({ proventos: [...s.proventos, p] })),

      deleteProvento: (id) =>
        set((s) => ({ proventos: s.proventos.filter((p) => p.id !== id) })),

      importOperations: (ops) =>
        set((s) => {
          const existingIds = new Set(s.operations.map((o) => o.id))
          const newOps = ops.filter((o) => !existingIds.has(o.id))
          return { operations: [...s.operations, ...newOps] }
        }),

      importProventos: (provs) =>
        set((s) => {
          const existingIds = new Set(s.proventos.map((p) => p.id))
          const newProvs = provs.filter((p) => !existingIds.has(p.id))
          return { proventos: [...s.proventos, ...newProvs] }
        }),

      setCashBalance: (amount) => set(() => ({ cashBalance: amount })),

      setAllocationTarget: (category, pct) =>
        set((s) => ({
          allocationTargets: { ...s.allocationTargets, [category]: pct },
        })),
    }),
    {
      name: 'portfolio_v1',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

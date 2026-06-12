import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { DCFResult, DCFHistoryEntry } from '../engines/dcf-engine'

// The vanilla JS S.dcfMethod values
export type DCFMethod = 'buffett' | 'classico'

/**
 * Nullable version of DCFAssumptions matching the vanilla S.assumptions object.
 * Fields that require user input can be null before the user loads a ticker.
 * The engine's DCFAssumptions type is stricter (non-nullable ll/shares) —
 * components should guard against null before calling runDCF.
 */
export interface NullableDCFAssumptions {
  ll: number | null
  payout: number | null
  roe: number | null
  g: number | null        // growth rate (derived or override)
  disc: number            // discount rate — always has a default
  perp: number            // perpetuity growth — always has a default
  shares: number | null
  price: number | null
}

export interface DCFState {
  // Core ticker data
  ticker: string | null
  companyName: string | null
  apiData: Record<string, unknown> | null

  // Projection settings
  projYears: 3 | 5
  dcfMethod: DCFMethod

  // Historical data (newest first, mirrors S.history)
  history: DCFHistoryEntry[]

  // Assumption inputs
  assumptions: NullableDCFAssumptions

  // Override tracking — persisted as string[] (Set not JSON-serializable)
  overrides: string[]

  // Original API values for restore button
  apiVals: Record<string, number>

  // Per-year direct LL overrides from table edits
  yearOverrides: Record<number, number>

  // Computed results — NOT persisted
  results: DCFResult | null
  resultsClassico: DCFResult | null
  resultsBuffett: DCFResult | null
}

export interface DCFActions {
  setTicker: (ticker: string, name: string, apiData: Record<string, unknown>) => void
  setAssumption: (field: keyof NullableDCFAssumptions, value: number | null) => void
  addOverride: (field: string) => void
  removeOverride: (field: string) => void
  clearAllOverrides: () => void
  setApiVals: (vals: Record<string, number>) => void
  setYearOverride: (year: number, value: number) => void
  clearYearOverride: (year: number) => void
  clearAllYearOverrides: () => void
  setProjYears: (years: 3 | 5) => void
  setDCFMethod: (method: DCFMethod) => void
  setHistory: (history: DCFHistoryEntry[]) => void
  setResults: (results: DCFResult | null, resultsClassico: DCFResult | null, resultsBuffett: DCFResult | null) => void
  reset: () => void
}

const DEFAULT_ASSUMPTIONS: DCFState['assumptions'] = {
  ll: null,
  payout: null,
  roe: null,
  g: null,
  disc: 0.15,
  perp: 0.03,
  shares: null,
  price: null,
}

const INITIAL_STATE: Omit<DCFState, 'results' | 'resultsClassico' | 'resultsBuffett'> = {
  ticker: null,
  companyName: null,
  apiData: null,
  projYears: 5,
  dcfMethod: 'buffett',
  history: [],
  assumptions: { ...DEFAULT_ASSUMPTIONS },
  overrides: [],
  apiVals: {},
  yearOverrides: {},
}

export const useDCFStore = create<DCFState & DCFActions>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      // results are runtime-only, never persisted
      results: null,
      resultsClassico: null,
      resultsBuffett: null,

      setTicker: (ticker, name, apiData) =>
        set({
          ticker,
          companyName: name,
          apiData,
          results: null,
          resultsClassico: null,
          resultsBuffett: null,
        }),

      setAssumption: (field, value) =>
        set((state) => ({
          assumptions: { ...state.assumptions, [field]: value },
        })),

      addOverride: (field) =>
        set((state) => ({
          overrides: state.overrides.includes(field)
            ? state.overrides
            : [...state.overrides, field],
        })),

      removeOverride: (field) =>
        set((state) => ({
          overrides: state.overrides.filter((f) => f !== field),
        })),

      clearAllOverrides: () => set({ overrides: [] }),

      setApiVals: (vals) => set({ apiVals: vals }),

      setYearOverride: (year, value) =>
        set((state) => ({
          yearOverrides: { ...state.yearOverrides, [year]: value },
        })),

      clearYearOverride: (year) =>
        set((state) => {
          const next = { ...state.yearOverrides }
          delete next[year]
          return { yearOverrides: next }
        }),

      clearAllYearOverrides: () => set({ yearOverrides: {} }),

      setProjYears: (years) => set({ projYears: years }),

      setDCFMethod: (method) => set({ dcfMethod: method }),

      setHistory: (history) => set({ history }),

      setResults: (results, resultsClassico, resultsBuffett) =>
        set({ results, resultsClassico, resultsBuffett }),

      reset: () =>
        set({
          ...INITIAL_STATE,
          results: null,
          resultsClassico: null,
          resultsBuffett: null,
        }),
    }),
    {
      name: 'dcf_session',
      storage: createJSONStorage(() => localStorage),
      // results are derived — exclude from persistence
      partialize: (state) => {
        const { results: _r, resultsClassico: _rc, resultsBuffett: _rb, ...persisted } = state
        return persisted
      },
    }
  )
)

// Convenience selector: overrides as a Set (matches vanilla JS API)
export const selectOverridesSet = (state: DCFState): Set<string> =>
  new Set(state.overrides)

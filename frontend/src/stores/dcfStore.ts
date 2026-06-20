import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { DCFResult, DCFHistoryEntry } from '../engines/dcf-engine'

// The vanilla JS S.dcfMethod values
export type DCFMethod = 'buffett' | 'classico'

export interface ScenarioState {
  enabled: boolean
  bear: number | null
  base: number | null
  bull: number | null
}

const INITIAL_SCENARIOS: ScenarioState = { enabled: false, bear: null, base: null, bull: null }

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

  // Scenario analysis — NOT persisted
  scenarios: ScenarioState
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
  setScenario: (key: 'bear' | 'base' | 'bull', value: number | null) => void
  toggleScenarios: (currentG: number | null) => void
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

const INITIAL_STATE: Omit<DCFState, 'results' | 'resultsClassico' | 'resultsBuffett' | 'scenarios'> = {
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

      // results and scenarios are runtime-only, never persisted
      results: null,
      resultsClassico: null,
      resultsBuffett: null,
      scenarios: INITIAL_SCENARIOS,

      setTicker: (ticker, name, apiData) =>
        set({
          ticker,
          companyName: name,
          apiData,
          results: null,
          resultsClassico: null,
          resultsBuffett: null,
          scenarios: INITIAL_SCENARIOS,
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

      setScenario: (key, value) =>
        set((state) => ({
          scenarios: { ...state.scenarios, [key]: value },
        })),

      toggleScenarios: (currentG) =>
        set((state) => {
          if (state.scenarios.enabled) {
            return { scenarios: INITIAL_SCENARIOS }
          }
          const base = currentG ?? null
          const bear = base != null ? Math.round(base * 0.7 * 10000) / 10000 : null
          const bull = base != null ? Math.round(base * 1.3 * 10000) / 10000 : null
          return { scenarios: { enabled: true, bear, base, bull } }
        }),

      reset: () =>
        set({
          ...INITIAL_STATE,
          results: null,
          resultsClassico: null,
          resultsBuffett: null,
          scenarios: INITIAL_SCENARIOS,
        }),
    }),
    {
      name: 'dcf_session',
      storage: createJSONStorage(() => localStorage),
      // results and scenarios are derived/ephemeral — exclude from persistence
      partialize: (state) => {
        const {
          results: _r,
          resultsClassico: _rc,
          resultsBuffett: _rb,
          scenarios: _s,
          ...persisted
        } = state
        return persisted
      },
    }
  )
)

// Convenience selector: overrides as a Set (matches vanilla JS API)
export const selectOverridesSet = (state: DCFState): Set<string> =>
  new Set(state.overrides)

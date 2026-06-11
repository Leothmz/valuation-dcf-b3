import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { WeightConfig } from '../engines/ranking-scores'

export type RankingMethod = 'thomaz' | 'bazin' | 'graham' | 'lynch' | 'joel'

export interface FilterConfig {
  // Bazin
  taxaBazin: number
  // Graham
  taxaGraham: number
  // Lynch
  taxaLynch: number
  // P/L range
  plMin: number | null
  plMax: number | null
  // Dívida Líquida / EBITDA range
  deMin: number | null
  deMax: number | null
  // DY minimum
  dyMin: number | null
  // Margem Líquida minimum
  margemMin: number | null
  // ROE minimum
  roeMin: number | null
  // Liquidity minimum (BRL/day)
  liquidezMin: number | null
  // Display mode: 'todos' | 'favoritos'
  show: 'todos' | 'favoritos'
  // Active sector tab ('' = todos, 'bank', 'insurance')
  sectorTab: string
  // Whether extras panel is open (UI state, not a filter)
  extrasOpen: boolean
}

export const DEFAULT_FILTER_CONFIG: FilterConfig = {
  taxaBazin: 0.06,
  taxaGraham: 22.5,
  taxaLynch: 3.0,
  plMin: 3,
  plMax: 15,
  deMin: null,
  deMax: 5,
  dyMin: 0.06,
  margemMin: 0.10,
  roeMin: 0.10,
  liquidezMin: 1_000_000,
  show: 'todos',
  sectorTab: '',
  extrasOpen: false,
}

export const DEFAULT_WEIGHTS: WeightConfig = {
  dy: 25,
  pl: 15,
  margemLiquida: 20,
  dividaLiquidaEbit: 10,
  roe: 20,
  roic: 10,
}

export interface SavedFilter {
  name: string
  config: FilterConfig
  savedAt: string
}

export interface RankingState {
  method: RankingMethod
  filterConfig: FilterConfig
  weights: WeightConfig
  favorites: string[]
  savedFilters: SavedFilter[]
  sortCol: string
  sortDir: 'asc' | 'desc'
  // lastFetch: timestamp of last successful load (for TTL check)
  lastFetch: number | null
}

export interface RankingActions {
  setMethod: (method: RankingMethod) => void
  setFilterConfig: (config: Partial<FilterConfig>) => void
  resetFilterConfig: () => void
  setWeights: (weights: Partial<WeightConfig>) => void
  addFavorite: (ticker: string) => void
  removeFavorite: (ticker: string) => void
  toggleFavorite: (ticker: string) => void
  setSavedFilters: (filters: SavedFilter[]) => void
  saveFilter: (name: string) => void
  deleteFilter: (name: string) => void
  setSortCol: (col: string) => void
  setSortDir: (dir: 'asc' | 'desc') => void
  setLastFetch: (ts: number | null) => void
  reset: () => void
}

const INITIAL_STATE: RankingState = {
  method: 'thomaz',
  filterConfig: { ...DEFAULT_FILTER_CONFIG },
  weights: { ...DEFAULT_WEIGHTS },
  favorites: [],
  savedFilters: [],
  sortCol: 'score',
  sortDir: 'desc',
  lastFetch: null,
}

export const useRankingStore = create<RankingState & RankingActions>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      setMethod: (method) => set({ method }),

      setFilterConfig: (partial) =>
        set((state) => ({
          filterConfig: { ...state.filterConfig, ...partial },
        })),

      resetFilterConfig: () =>
        set({ filterConfig: { ...DEFAULT_FILTER_CONFIG } }),

      setWeights: (partial) =>
        set((state) => ({
          weights: { ...state.weights, ...partial },
        })),

      addFavorite: (ticker) =>
        set((state) => ({
          favorites: state.favorites.includes(ticker)
            ? state.favorites
            : [...state.favorites, ticker],
        })),

      removeFavorite: (ticker) =>
        set((state) => ({
          favorites: state.favorites.filter((t) => t !== ticker),
        })),

      toggleFavorite: (ticker) => {
        const { favorites } = get()
        if (favorites.includes(ticker)) {
          set({ favorites: favorites.filter((t) => t !== ticker) })
        } else {
          set({ favorites: [...favorites, ticker] })
        }
      },

      setSavedFilters: (filters) => set({ savedFilters: filters }),

      saveFilter: (name) =>
        set((state) => {
          const entry: SavedFilter = {
            name,
            config: { ...state.filterConfig },
            savedAt: new Date().toISOString(),
          }
          const filtered = state.savedFilters.filter((f) => f.name !== name)
          return { savedFilters: [...filtered, entry] }
        }),

      deleteFilter: (name) =>
        set((state) => ({
          savedFilters: state.savedFilters.filter((f) => f.name !== name),
        })),

      setSortCol: (col) => set({ sortCol: col }),

      setSortDir: (dir) => set({ sortDir: dir }),

      setLastFetch: (ts) => set({ lastFetch: ts }),

      reset: () => set({ ...INITIAL_STATE }),
    }),
    {
      name: 'ranking_settings',
      storage: createJSONStorage(() => localStorage),
      // stocks/ranked are NOT persisted — managed by TanStack Query
      // favorites also persisted separately for backwards compatibility
      onRehydrateStorage: () => (state) => {
        if (!state) return
        // Sync favorites to legacy key for backwards compat
        try {
          const legacy = JSON.parse(localStorage.getItem('ranking_favorites') || '[]')
          if (Array.isArray(legacy) && legacy.length > 0 && state.favorites.length === 0) {
            state.favorites = legacy
          }
        } catch {
          // ignore
        }
      },
    }
  )
)

// Selector helpers
export const selectIsFavorite = (ticker: string) => (state: RankingState) =>
  state.favorites.includes(ticker)

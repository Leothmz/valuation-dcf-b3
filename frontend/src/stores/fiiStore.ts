import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type FIISegmento =
  | 'todos'
  | 'Logística'
  | 'Shoppings'
  | 'Lajes Corp.'
  | 'Papel/CRI'
  | 'Residencial'
  | 'Híbrido'

export interface FIIFilterConfig {
  // DY minimum (0–1 fraction, e.g. 0.06 = 6%)
  dyMin: number | null
  // Liquidity minimum (BRL/day)
  liquidezMin: number | null
  // Vacancy maximum (0–1 fraction)
  vacanciMax: number | null
  // P/VP maximum
  pvpMax: number | null
  // FFO Yield minimum (0–1 fraction)
  ffoYieldMin: number | null
}

export const DEFAULT_FII_FILTER_CONFIG: FIIFilterConfig = {
  dyMin: 0.06,
  liquidezMin: 500_000,
  vacanciMax: 0.25,
  pvpMax: null,
  ffoYieldMin: null,
}

export interface FIIState {
  segmento: FIISegmento
  filterConfig: FIIFilterConfig
  favorites: string[]
  customTickers: string[]
  // lastFetch: timestamp for TanStack Query / cache TTL check
  lastFetch: number | null
}

export interface FIIActions {
  setSegmento: (segmento: FIISegmento) => void
  setFilterConfig: (partial: Partial<FIIFilterConfig>) => void
  resetFilterConfig: () => void
  addFavorite: (ticker: string) => void
  removeFavorite: (ticker: string) => void
  toggleFavorite: (ticker: string) => void
  addCustomTicker: (ticker: string) => void
  removeCustomTicker: (ticker: string) => void
  setCustomTickers: (tickers: string[]) => void
  setLastFetch: (ts: number | null) => void
  reset: () => void
}

const INITIAL_STATE: FIIState = {
  segmento: 'todos',
  filterConfig: { ...DEFAULT_FII_FILTER_CONFIG },
  favorites: [],
  customTickers: [],
  lastFetch: null,
}

export const useFIIStore = create<FIIState & FIIActions>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      setSegmento: (segmento) => set({ segmento }),

      setFilterConfig: (partial) =>
        set((state) => ({
          filterConfig: { ...state.filterConfig, ...partial },
        })),

      resetFilterConfig: () =>
        set({ filterConfig: { ...DEFAULT_FII_FILTER_CONFIG } }),

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

      addCustomTicker: (ticker) =>
        set((state) => ({
          customTickers: state.customTickers.includes(ticker)
            ? state.customTickers
            : [...state.customTickers, ticker],
        })),

      removeCustomTicker: (ticker) =>
        set((state) => ({
          customTickers: state.customTickers.filter((t) => t !== ticker),
        })),

      setCustomTickers: (tickers) => set({ customTickers: tickers }),

      setLastFetch: (ts) => set({ lastFetch: ts }),

      reset: () => set({ ...INITIAL_STATE }),
    }),
    {
      name: 'fii_ranking_settings',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        // Sync favorites from legacy key for backwards compat
        try {
          const legacy = JSON.parse(localStorage.getItem('fii_favorites') || '[]')
          if (Array.isArray(legacy) && legacy.length > 0 && state.favorites.length === 0) {
            state.favorites = legacy
          }
        } catch {
          // ignore
        }
        // Sync customTickers from legacy key for backwards compat
        try {
          const legacyCustom = JSON.parse(localStorage.getItem('fii_custom_tickers') || '[]')
          if (Array.isArray(legacyCustom) && legacyCustom.length > 0 && state.customTickers.length === 0) {
            state.customTickers = legacyCustom
          }
        } catch {
          // ignore
        }
      },
    }
  )
)

// Selector helpers
export const selectFIIIsFavorite = (ticker: string) => (state: FIIState) =>
  state.favorites.includes(ticker)

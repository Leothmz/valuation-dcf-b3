import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { DCFHistoryEntry } from '../engines/dcf-engine'

export interface PriceHistoryEntry {
  fairPrice: number
  savedAt: string       // ISO string
  annotation?: string  // manual note per entry
}

export interface WatchlistEntry {
  ticker: string
  name: string
  fairPrice: number
  savedAt: string  // ISO string
  projYears: number
  dcfMethod: string
  assumptions: Record<string, number | null>
  overrides: string[]
  apiVals: Record<string, number>
  yearOverrides: Record<number, number>
  history: DCFHistoryEntry[]
  notes?: string               // per-ticker notes
  priceHistory?: PriceHistoryEntry[]  // used in Task 2
}

export interface WatchlistState {
  entries: Record<string, WatchlistEntry>
}

export interface WatchlistActions {
  save: (entry: WatchlistEntry) => void
  remove: (ticker: string) => void
  clear: () => void
  has: (ticker: string) => boolean
  updateNotes: (ticker: string, notes: string) => void
  updateHistoryAnnotation: (ticker: string, savedAt: string, annotation: string) => void
}

export const useWatchlistStore = create<WatchlistState & WatchlistActions>()(
  persist(
    (set, get) => ({
      entries: {},

      save: (entry) =>
        set((state) => ({
          entries: { ...state.entries, [entry.ticker]: entry },
        })),

      remove: (ticker) =>
        set((state) => {
          const next = { ...state.entries }
          delete next[ticker]
          return { entries: next }
        }),

      clear: () => set({ entries: {} }),

      has: (ticker) => ticker in get().entries,

      updateNotes: (ticker, notes) =>
        set((state) => {
          const existing = state.entries[ticker]
          if (!existing) return state
          return {
            entries: {
              ...state.entries,
              [ticker]: { ...existing, notes },
            },
          }
        }),

      updateHistoryAnnotation: (ticker, savedAt, annotation) =>
        set((state) => {
          const existing = state.entries[ticker]
          if (!existing) return state
          const priceHistory = (existing.priceHistory ?? []).map((h) =>
            h.savedAt === savedAt ? { ...h, annotation } : h
          )
          return {
            entries: {
              ...state.entries,
              [ticker]: { ...existing, priceHistory },
            },
          }
        }),
    }),
    {
      name: 'dcf_watchlist',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

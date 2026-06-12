import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { DCFHistoryEntry } from '../engines/dcf-engine'

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
}

export interface WatchlistState {
  entries: Record<string, WatchlistEntry>
}

export interface WatchlistActions {
  save: (entry: WatchlistEntry) => void
  remove: (ticker: string) => void
  clear: () => void
  has: (ticker: string) => boolean
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
    }),
    {
      name: 'dcf_watchlist',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

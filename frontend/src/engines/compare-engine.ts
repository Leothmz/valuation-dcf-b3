export type Direction = 'asc' | 'desc'

export interface BestWorst {
  best: number | null
  worst: number | null
}

// Finds the index of the best/worst value among 2-3 columns for one metric row.
// direction 'asc' = lower wins (e.g. P/L), 'desc' = higher wins (e.g. DY).
// Returns nulls when fewer than 2 valid values or all values tie.
export function bestWorstIndices(values: Array<number | null | undefined>, direction: Direction): BestWorst {
  const valid = values
    .map((v, i) => ({ v, i }))
    .filter((x): x is { v: number; i: number } => x.v != null)

  if (valid.length < 2) return { best: null, worst: null }

  const sorted = [...valid].sort((a, b) => a.v - b.v)
  const lo = sorted[0]
  const hi = sorted[sorted.length - 1]
  if (lo.v === hi.v) return { best: null, worst: null }

  return direction === 'asc'
    ? { best: lo.i, worst: hi.i }
    : { best: hi.i, worst: lo.i }
}

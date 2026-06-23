interface PositionBadgeProps {
  rank: number
}

export function PositionBadge({ rank }: PositionBadgeProps) {
  if (rank === 1) {
    return (
      <span className="relative inline-flex items-center justify-center w-8 h-8" title="TOP">
        <span
          className="inline-flex items-center justify-center w-8 h-8 rounded-[8px] text-[13px] font-bold font-mono"
          style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff',
            boxShadow: '0 0 12px rgba(16,185,129,.4)',
          }}
        >
          {rank}
        </span>
        <span
          className="absolute -top-2 -right-2 text-[8px] font-bold tracking-[.05em] px-[4px] py-[1px] rounded-[4px] leading-tight"
          style={{
            background: '#10b981',
            color: '#fff',
            boxShadow: '0 0 6px rgba(16,185,129,.5)',
          }}
        >
          TOP
        </span>
      </span>
    )
  }

  if (rank === 2) {
    return (
      <span
        className="inline-flex items-center justify-center w-8 h-8 rounded-[8px] text-[13px] font-bold font-mono"
        style={{
          background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
          color: '#fff',
          boxShadow: '0 0 12px rgba(6,182,212,.3)',
        }}
      >
        {rank}
      </span>
    )
  }

  if (rank === 3) {
    return (
      <span
        className="inline-flex items-center justify-center w-8 h-8 rounded-[8px] text-[13px] font-bold font-mono"
        style={{
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: '#fff',
          boxShadow: '0 0 12px rgba(245,158,11,.3)',
        }}
      >
        {rank}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-[8px] text-[13px] font-bold font-mono text-text-muted">
      {rank}
    </span>
  )
}

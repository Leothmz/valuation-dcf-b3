interface PositionBadgeProps {
  rank: number
}

export function PositionBadge({ rank }: PositionBadgeProps) {
  if (rank === 1) {
    return (
      <div
        className="inline-flex items-center gap-1"
      >
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
          className="text-[10px] font-bold tracking-[.1em] px-[5px] py-[2px] rounded-[4px]"
          style={{
            background: 'rgba(16,185,129,.15)',
            color: '#10b981',
            border: '1px solid rgba(16,185,129,.3)',
          }}
        >
          TOP
        </span>
      </div>
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

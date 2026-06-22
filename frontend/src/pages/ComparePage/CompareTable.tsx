export interface CompareCell {
  value: string
  highlight: 'best' | 'worst' | null
}

export interface CompareRow {
  label: string
  cells: CompareCell[]
}

interface CompareTableProps {
  tickers: string[]
  rows: CompareRow[]
  isLoading: boolean
}

export function CompareTable({ tickers, rows, isLoading }: CompareTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-text-muted text-[14px]">
        Carregando dados…
      </div>
    )
  }

  return (
    <div className="border border-border rounded-[14px] overflow-hidden" style={{ boxShadow: '0 4px 16px rgba(0,0,0,.5)' }}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="bg-bg-2 border-b border-border text-text-muted text-[11px] font-semibold tracking-[.08em] uppercase py-3 px-3 text-left whitespace-nowrap">
                Indicador
              </th>
              {tickers.map((t) => (
                <th
                  key={t}
                  className="bg-bg-2 border-b border-border text-[13px] font-mono font-semibold py-3 px-3 text-right whitespace-nowrap"
                  style={{ color: 'var(--color-cyan)' }}
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-border-muted last:border-b-0">
                <td className="py-[10px] px-3 align-middle text-[13px] text-text-sec whitespace-nowrap">
                  {row.label}
                </td>
                {row.cells.map((cell, i) => (
                  <td
                    key={i}
                    className="py-[10px] px-3 text-right align-middle font-mono text-[13px]"
                    style={{
                      color: cell.highlight === 'best' ? 'var(--color-green)' : cell.highlight === 'worst' ? 'var(--color-red)' : 'var(--color-text-base)',
                      background: cell.highlight === 'best' ? 'var(--color-green-dim)' : cell.highlight === 'worst' ? 'var(--color-red-dim)' : undefined,
                    }}
                  >
                    {cell.value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

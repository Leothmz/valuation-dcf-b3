export interface CompareCell {
  value: string
  highlight: 'best' | 'worst' | null
}

export interface CompareRow {
  label: string
  shortLabel?: string
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
    <div className="flex flex-col gap-2">
      {/* Legenda: sem ela a cor é um julgamento sem critério declarado. Antes cada
          linha pintava uma célula de verde e outra de vermelho (2/3 da tabela
          tingida, e com a semântica trocada — verde/vermelho são direção de valor
          no resto do app). A primeira tentativa de correção usou uma borda
          esquerda de 2px na célula vencedora, mas a barra encostava na coluna
          vizinha e imitava linha de grade. O selo marca o próprio número. */}
      <div className="flex items-center gap-2 text-[11px] text-text-sec">
        <span
          aria-hidden
          className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{
            background: 'var(--color-cyan-dim)',
            color: 'var(--color-cyan)',
            border: '1px solid rgba(6,182,212,0.25)',
          }}
        >
          valor
        </span>
        destacado assim = melhor valor de cada linha entre os tickers selecionados
      </div>

      <div className="border border-border rounded-[14px] overflow-hidden" style={{ boxShadow: '0 4px 16px rgba(0,0,0,.5)' }}>
        <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-bg-2 border-b border-r border-border text-text-muted text-[11px] font-semibold tracking-[.08em] uppercase py-3 px-3 text-left whitespace-nowrap">
                Indicador
              </th>
              {tickers.map((t) => (
                <th
                  key={t}
                  className="min-w-[88px] bg-bg-2 border-b border-border text-[13px] font-mono font-semibold py-3 px-3 text-right whitespace-nowrap"
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
                <td
                  className="sticky left-0 z-10 border-r border-border py-[10px] px-3 align-middle text-[13px] text-text-sec whitespace-nowrap"
                  style={{ background: 'var(--color-bg-1)' }}
                >
                  <span className="md:hidden">{row.shortLabel ?? row.label}</span>
                  <span className="hidden md:inline">{row.label}</span>
                </td>
                {/* Só o vencedor é marcado, e em ciano: verde e vermelho significam
                    direção de valor (alta/baixa, lucro/prejuízo) no resto do app,
                    e aqui significavam "melhor/pior entre os 3" — o mesmo ticker
                    aparecia com P/L verde e DY vermelho, lido como julgamento
                    contraditório. A pior célula não precisa de marca: o contraste
                    com a melhor já a identifica. */}
                {row.cells.map((cell, i) => {
                  const isBest = cell.highlight === 'best'
                  return (
                    <td
                      key={i}
                      className="min-w-[88px] py-[10px] px-3 text-right align-middle font-mono text-[11px] md:text-[13px]"
                      style={{ color: 'var(--color-text-base)' }}
                    >
                      {isBest ? (
                        <span
                          aria-label="Melhor valor da linha"
                          className="inline-block rounded-full px-2.5 py-0.5 font-semibold"
                          style={{
                            background: 'var(--color-cyan-dim)',
                            color: 'var(--color-cyan)',
                            border: '1px solid rgba(6,182,212,0.25)',
                          }}
                        >
                          {cell.value}
                        </span>
                      ) : (
                        cell.value
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}

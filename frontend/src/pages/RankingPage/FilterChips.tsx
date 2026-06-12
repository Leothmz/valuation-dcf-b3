import { useState, useRef, useEffect } from 'react'
import type { FilterConfig } from '../../stores/rankingStore'
import { DEFAULT_FILTER_CONFIG } from '../../stores/rankingStore'

interface FilterChipsProps {
  config: FilterConfig
  onChange: (partial: Partial<FilterConfig>) => void
  onReset: () => void
}

// Format a filter value for display in the chip label
function fmtPct(v: number | null): string {
  if (v == null) return ''
  return (v * 100).toFixed(0) + '%'
}
function fmtNum(v: number | null, decimals = 1): string {
  if (v == null) return ''
  return v.toLocaleString('pt-BR', { maximumFractionDigits: decimals })
}
function fmtLiq(v: number | null): string {
  if (v == null) return ''
  if (v >= 1_000_000) return 'R$ ' + (v / 1_000_000).toFixed(0) + 'M'
  if (v >= 1_000)     return 'R$ ' + (v / 1_000).toFixed(0) + 'k'
  return 'R$ ' + v
}

interface PopoverProps {
  onClose: () => void
  children: React.ReactNode
  style?: React.CSSProperties
}

function Popover({ onClose, children, style }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute z-50 top-full mt-2 rounded-[12px] border border-border p-4"
      style={{
        background: 'var(--color-bg-2)',
        boxShadow: '0 8px 32px rgba(0,0,0,.6)',
        minWidth: 220,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

interface NumInputProps {
  label: string
  value: number | null
  onChange: (v: number | null) => void
  placeholder?: string
  step?: number
  suffix?: string
}

function NumInput({ label, value, onChange, placeholder = '—', step = 1, suffix }: NumInputProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold tracking-[.08em] uppercase text-text-muted">{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          step={step}
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(e) => {
            const v = e.target.value
            onChange(v === '' ? null : parseFloat(v))
          }}
          className="w-full rounded-[8px] border border-border bg-bg-3 text-text-base text-[13px] px-3 py-[6px] outline-none focus:border-cyan"
        />
        {suffix && <span className="text-[12px] text-text-muted">{suffix}</span>}
      </div>
    </label>
  )
}

interface ChipProps {
  label: string
  active: boolean
  onClick: () => void
}

function Chip({ label, active, onClick }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-[5px] rounded-full text-[12px] font-medium cursor-pointer border whitespace-nowrap"
      style={{
        background: active ? 'rgba(6,182,212,.12)' : 'var(--color-bg-3)',
        color: active ? 'var(--color-cyan)' : 'var(--color-text-sec)',
        borderColor: active ? 'rgba(6,182,212,.35)' : 'var(--color-border)',
      }}
    >
      {label}
    </button>
  )
}

export function FilterChips({ config, onChange, onReset }: FilterChipsProps) {
  const [open, setOpen] = useState<string | null>(null)

  function close() { setOpen(null) }
  function toggle(key: string) { setOpen(prev => prev === key ? null : key) }

  const def = DEFAULT_FILTER_CONFIG

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* DY chip */}
      <div className="relative">
        <Chip
          label={config.dyMin != null ? `DY ≥ ${fmtPct(config.dyMin)}` : 'DY'}
          active={config.dyMin != null && config.dyMin !== def.dyMin}
          onClick={() => toggle('dy')}
        />
        {open === 'dy' && (
          <Popover onClose={close}>
            <div className="flex flex-col gap-3">
              <span className="text-[13px] font-semibold text-text-base">DY mínimo</span>
              <NumInput
                label="Mínimo (%)"
                value={config.dyMin != null ? config.dyMin * 100 : null}
                onChange={(v) => onChange({ dyMin: v != null ? v / 100 : null })}
                step={0.5}
                placeholder="ex: 6"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button className="text-[12px] text-text-muted cursor-pointer" onClick={() => { onChange({ dyMin: null }); close() }}>Limpar</button>
                <button
                  className="px-3 py-[5px] rounded-[8px] text-[12px] font-semibold cursor-pointer"
                  style={{ background: 'var(--color-cyan)', color: '#060910' }}
                  onClick={close}
                >
                  Aplicar
                </button>
              </div>
            </div>
          </Popover>
        )}
      </div>

      {/* P/L chip */}
      <div className="relative">
        <Chip
          label={
            config.plMin != null || config.plMax != null
              ? `P/L ${config.plMin ?? ''}–${config.plMax ?? ''}`
              : 'P/L'
          }
          active={(config.plMin != null && config.plMin !== def.plMin) || (config.plMax != null && config.plMax !== def.plMax)}
          onClick={() => toggle('pl')}
        />
        {open === 'pl' && (
          <Popover onClose={close}>
            <div className="flex flex-col gap-3">
              <span className="text-[13px] font-semibold text-text-base">Filtro P/L</span>
              <NumInput label="Mínimo" value={config.plMin} onChange={(v) => onChange({ plMin: v })} step={0.5} />
              <NumInput label="Máximo" value={config.plMax} onChange={(v) => onChange({ plMax: v })} step={0.5} />
              <div className="flex justify-end gap-2 pt-1">
                <button className="text-[12px] text-text-muted cursor-pointer" onClick={() => { onChange({ plMin: null, plMax: null }); close() }}>Limpar</button>
                <button
                  className="px-3 py-[5px] rounded-[8px] text-[12px] font-semibold cursor-pointer"
                  style={{ background: 'var(--color-cyan)', color: '#060910' }}
                  onClick={close}
                >
                  Aplicar
                </button>
              </div>
            </div>
          </Popover>
        )}
      </div>

      {/* DL/EBITDA chip */}
      <div className="relative">
        <Chip
          label={
            config.deMax != null
              ? `DL/EBITDA ≤ ${fmtNum(config.deMax)}`
              : 'DL/EBITDA'
          }
          active={config.deMax != null && config.deMax !== def.deMax}
          onClick={() => toggle('de')}
        />
        {open === 'de' && (
          <Popover onClose={close}>
            <div className="flex flex-col gap-3">
              <span className="text-[13px] font-semibold text-text-base">Dívida Líq. / EBITDA</span>
              <NumInput label="Mínimo" value={config.deMin} onChange={(v) => onChange({ deMin: v })} step={0.5} />
              <NumInput label="Máximo" value={config.deMax} onChange={(v) => onChange({ deMax: v })} step={0.5} />
              <div className="flex justify-end gap-2 pt-1">
                <button className="text-[12px] text-text-muted cursor-pointer" onClick={() => { onChange({ deMin: null, deMax: null }); close() }}>Limpar</button>
                <button
                  className="px-3 py-[5px] rounded-[8px] text-[12px] font-semibold cursor-pointer"
                  style={{ background: 'var(--color-cyan)', color: '#060910' }}
                  onClick={close}
                >
                  Aplicar
                </button>
              </div>
            </div>
          </Popover>
        )}
      </div>

      {/* Bazin rate chip */}
      <div className="relative">
        <Chip
          label={`Bazin ${fmtPct(config.taxaBazin)}`}
          active={config.taxaBazin !== def.taxaBazin}
          onClick={() => toggle('bazin')}
        />
        {open === 'bazin' && (
          <Popover onClose={close}>
            <div className="flex flex-col gap-3">
              <span className="text-[13px] font-semibold text-text-base">Taxa Bazin</span>
              <NumInput
                label="Taxa (%)"
                value={config.taxaBazin * 100}
                onChange={(v) => onChange({ taxaBazin: (v ?? 6) / 100 })}
                step={0.5}
              />
              <div className="flex justify-end pt-1">
                <button
                  className="px-3 py-[5px] rounded-[8px] text-[12px] font-semibold cursor-pointer"
                  style={{ background: 'var(--color-cyan)', color: '#060910' }}
                  onClick={close}
                >
                  Aplicar
                </button>
              </div>
            </div>
          </Popover>
        )}
      </div>

      {/* Graham multiplier chip */}
      <div className="relative">
        <Chip
          label={`Graham ×${fmtNum(config.taxaGraham)}`}
          active={config.taxaGraham !== def.taxaGraham}
          onClick={() => toggle('graham')}
        />
        {open === 'graham' && (
          <Popover onClose={close}>
            <div className="flex flex-col gap-3">
              <span className="text-[13px] font-semibold text-text-base">Múltiplo Graham</span>
              <NumInput
                label="Multiplicador"
                value={config.taxaGraham}
                onChange={(v) => onChange({ taxaGraham: v ?? 22.5 })}
                step={0.5}
              />
              <div className="flex justify-end pt-1">
                <button
                  className="px-3 py-[5px] rounded-[8px] text-[12px] font-semibold cursor-pointer"
                  style={{ background: 'var(--color-cyan)', color: '#060910' }}
                  onClick={close}
                >
                  Aplicar
                </button>
              </div>
            </div>
          </Popover>
        )}
      </div>

      {/* Lynch reference chip */}
      <div className="relative">
        <Chip
          label={`Lynch ${fmtNum(config.taxaLynch)}`}
          active={config.taxaLynch !== def.taxaLynch}
          onClick={() => toggle('lynch')}
        />
        {open === 'lynch' && (
          <Popover onClose={close}>
            <div className="flex flex-col gap-3">
              <span className="text-[13px] font-semibold text-text-base">Referência Lynch (PEG)</span>
              <NumInput
                label="Referência"
                value={config.taxaLynch}
                onChange={(v) => onChange({ taxaLynch: v ?? 3.0 })}
                step={0.1}
              />
              <div className="flex justify-end pt-1">
                <button
                  className="px-3 py-[5px] rounded-[8px] text-[12px] font-semibold cursor-pointer"
                  style={{ background: 'var(--color-cyan)', color: '#060910' }}
                  onClick={close}
                >
                  Aplicar
                </button>
              </div>
            </div>
          </Popover>
        )}
      </div>

      {/* Margem Líq. chip */}
      <div className="relative">
        <Chip
          label={config.margemMin != null ? `Margem ≥ ${fmtPct(config.margemMin)}` : 'Margem Líq.'}
          active={config.margemMin != null && config.margemMin !== def.margemMin}
          onClick={() => toggle('margem')}
        />
        {open === 'margem' && (
          <Popover onClose={close}>
            <div className="flex flex-col gap-3">
              <span className="text-[13px] font-semibold text-text-base">Margem Líquida mínima</span>
              <NumInput
                label="Mínimo (%)"
                value={config.margemMin != null ? config.margemMin * 100 : null}
                onChange={(v) => onChange({ margemMin: v != null ? v / 100 : null })}
                step={1}
              />
              <div className="flex justify-end gap-2 pt-1">
                <button className="text-[12px] text-text-muted cursor-pointer" onClick={() => { onChange({ margemMin: null }); close() }}>Limpar</button>
                <button
                  className="px-3 py-[5px] rounded-[8px] text-[12px] font-semibold cursor-pointer"
                  style={{ background: 'var(--color-cyan)', color: '#060910' }}
                  onClick={close}
                >
                  Aplicar
                </button>
              </div>
            </div>
          </Popover>
        )}
      </div>

      {/* ROE chip */}
      <div className="relative">
        <Chip
          label={config.roeMin != null ? `ROE ≥ ${fmtPct(config.roeMin)}` : 'ROE'}
          active={config.roeMin != null && config.roeMin !== def.roeMin}
          onClick={() => toggle('roe')}
        />
        {open === 'roe' && (
          <Popover onClose={close}>
            <div className="flex flex-col gap-3">
              <span className="text-[13px] font-semibold text-text-base">ROE mínimo</span>
              <NumInput
                label="Mínimo (%)"
                value={config.roeMin != null ? config.roeMin * 100 : null}
                onChange={(v) => onChange({ roeMin: v != null ? v / 100 : null })}
                step={1}
              />
              <div className="flex justify-end gap-2 pt-1">
                <button className="text-[12px] text-text-muted cursor-pointer" onClick={() => { onChange({ roeMin: null }); close() }}>Limpar</button>
                <button
                  className="px-3 py-[5px] rounded-[8px] text-[12px] font-semibold cursor-pointer"
                  style={{ background: 'var(--color-cyan)', color: '#060910' }}
                  onClick={close}
                >
                  Aplicar
                </button>
              </div>
            </div>
          </Popover>
        )}
      </div>

      {/* Liquidez chip */}
      <div className="relative">
        <Chip
          label={config.liquidezMin != null ? `Liq. ≥ ${fmtLiq(config.liquidezMin)}` : 'Liquidez'}
          active={config.liquidezMin != null && config.liquidezMin !== def.liquidezMin}
          onClick={() => toggle('liq')}
        />
        {open === 'liq' && (
          <Popover onClose={close}>
            <div className="flex flex-col gap-3">
              <span className="text-[13px] font-semibold text-text-base">Liquidez mínima (R$/dia)</span>
              <NumInput
                label="Mínimo (R$)"
                value={config.liquidezMin}
                onChange={(v) => onChange({ liquidezMin: v })}
                step={100000}
                placeholder="ex: 1000000"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button className="text-[12px] text-text-muted cursor-pointer" onClick={() => { onChange({ liquidezMin: null }); close() }}>Limpar</button>
                <button
                  className="px-3 py-[5px] rounded-[8px] text-[12px] font-semibold cursor-pointer"
                  style={{ background: 'var(--color-cyan)', color: '#060910' }}
                  onClick={close}
                >
                  Aplicar
                </button>
              </div>
            </div>
          </Popover>
        )}
      </div>

      {/* Favoritos chip */}
      <Chip
        label="★ Favoritos"
        active={config.show === 'favoritos'}
        onClick={() => onChange({ show: config.show === 'favoritos' ? 'todos' : 'favoritos' })}
      />

      {/* Reset button */}
      <button
        onClick={onReset}
        className="px-3 py-[5px] rounded-full text-[12px] font-medium cursor-pointer border border-border text-text-muted ml-1"
        style={{ background: 'var(--color-bg-3)' }}
      >
        Reiniciar
      </button>
    </div>
  )
}

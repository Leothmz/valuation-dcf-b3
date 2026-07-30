import { useState, useRef, useEffect } from 'react'
import { Search } from 'lucide-react'

const B3_TICKERS = [
  'ABCB4','ABEV3','AGRO3','ALOS3','ALPA4','ALUP11','AMBP3','ANIM3','ARML3','ASAI3','AURE3','AZUL4',
  'AZZA3','B3SA3','BBAS3','BBDC3','BBDC4','BBSE3','BEEF3','BLAU3','BMGB4','BPAC11','BRAP4','BRAV3',
  'BRBI11','BRFS3','BRPR3','BRSR6','BRKM5','CAML3','CBAV3','CCRO3','CEAB3','CESP6','CGRA4','CIEL3',
  'CMIG3','CMIG4','CMIN3','COGN3','CPFE3','CPLE6','CRFB3','CSAN3','CSMG3','CSNA3','CVCB3','CXSE3',
  'CURY3','CYRE3','DASA3','DESK3','DIRR3','DXCO3','ECOR3','EGIE3','ELET3','ELET6','EMBR3','ENBR3',
  'ENEV3','ENGI11','EQPA3','EQTL3','EVEN3','EZTC3','FLRY3','FRAS3','GFSA3','GGBR3','GGBR4','GGPS3',
  'GOAU4','GOLL4','GRND3','HAPV3','HBOR3','HBSA3','HYPE3','IGTI11','IRBR3','ISAE4','ITSA4','ITUB3',
  'ITUB4','JALL3','JBSS3','JHSF3','JSLG3','KEPL3','KLBN11','LAVV3','LEVE3','LJQQ3','LOGN3','LOGG3',
  'LREN3','LWSA3','MDNE3','MDIA3','MGLU3','MRFG3','MRVE3','MOVI3','MTRE3','MULT3','MYPK3','NATU3',
  'NEOE3','NTCO3','ONCO3','ODPV3','ORVR3','PARD3','PCAR3','PETR3','PETR4','PETZ3','PLPL3','PNVL3',
  'POMO4','POSI3','PRIO3','PSSA3','QUAL3','RADL3','RAIL3','RANI3','RAIZ4','RAPT4','RDOR3','RECV3',
  'RENT3','RIAA3','ROMI3','RRRP3','SANB11','SAPR11','SBSP3','SEER3','SEQL3','SHUL4','SIMH3','SLCE3',
  'SMFT3','SMTO3','SOJA3','SOMA3','SULA11','SUZB3','TAEE11','TEND3','TGMA3','TIMS3','TOTS3','TRIS3',
  'TRPL4','TTEN3','TUPY3','UGPA3','UNIP6','USIM5','VALE3','VAMO3','VBBR3','VITT3','VIVT3','VLID3',
  'VIVA3','VTRU3','VULC3','WEGE3','WIZC3','YDUQ3','CGAS3','ARZZ3',
]

interface DCFSearchProps {
  initialValue?: string
  isLoading: boolean
  onSearch: (ticker: string) => void
}

export function DCFSearch({ initialValue = '', isLoading, onSearch }: DCFSearchProps) {
  const [value, setValue] = useState(initialValue)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [focusedIdx, setFocusedIdx] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value.toUpperCase()
    setValue(q)
    setFocusedIdx(-1)
    if (!q) { setSuggestions([]); return }
    const hits = B3_TICKERS.filter(t => t.startsWith(q)).slice(0, 8)
    setSuggestions(hits)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIdx(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && focusedIdx >= 0) {
      e.preventDefault()
      const t = suggestions[focusedIdx]
      setValue(t)
      setSuggestions([])
      onSearch(t)
    } else if (e.key === 'Escape') {
      setSuggestions([])
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const t = value.trim().toUpperCase()
    if (t) { setSuggestions([]); onSearch(t) }
  }

  function handleSelect(ticker: string) {
    setValue(ticker)
    setSuggestions([])
    onSearch(ticker)
  }

  // Close dropdown on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setSuggestions([])
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 flex-1 max-w-md">
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ex: WEGE3, ITUB4..."
          maxLength={7}
          autoComplete="off"
          spellCheck={false}
          className="w-full h-[42px] bg-bg-3 border border-border rounded-[10px] text-text-base font-mono text-[16px] md:text-sm
                     px-[14px] uppercase outline-none placeholder:text-text-muted placeholder:normal-case
                     focus:border-cyan focus:shadow-[0_0_0_3px_rgba(6,182,212,0.08)]
                     transition-colors"
        />
        {suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute top-[calc(100%+4px)] left-0 right-0 bg-bg-2 border border-border
                       rounded-[10px] overflow-hidden z-50 shadow-lg"
          >
            {suggestions.map((t, i) => (
              <div
                key={t}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(t) }}
                className={`px-[14px] py-[9px] font-mono text-[13px] cursor-pointer text-text-base
                            hover:bg-bg-4 hover:text-cyan
                            ${i === focusedIdx ? 'bg-bg-4 text-cyan' : ''}`}
              >
                {t}
              </div>
            ))}
          </div>
        )}
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="h-[42px] px-[18px] bg-gradient-to-br from-cyan to-[#0891b2] text-bg-0
                   font-semibold text-sm rounded-[10px] whitespace-nowrap cursor-pointer
                   shadow-[0_2px_8px_rgba(6,182,212,0.25)]
                   hover:opacity-90 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(6,182,212,0.35)]
                   disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0
                   flex items-center gap-1.5 transition-all"
      >
        <Search size={14} />
        {isLoading ? '…' : 'Buscar'}
      </button>
    </form>
  )
}

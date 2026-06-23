import { useState, useEffect } from 'react'
import type { DCFMethod } from '../../stores/dcfStore'
import { useEscapeToClose } from '../../hooks/useKeyBinding'

interface DCFMethodModalProps {
  open: boolean
  currentMethod: DCFMethod
  onApply: (method: DCFMethod) => void
  onClose: () => void
}

const METHODS: { value: DCFMethod; name: string; desc: string }[] = [
  {
    value: 'classico',
    name: 'Clássico FCD',
    desc: 'Desconto do perpétuo igual ao dos anos anteriores',
  },
  {
    value: 'buffett',
    name: 'Buffett',
    desc: 'Taxa de desconto fixa de 10% no perpétuo',
  },
]

export function DCFMethodModal({ open, currentMethod, onApply, onClose }: DCFMethodModalProps) {
  const [selected, setSelected] = useState<DCFMethod>(currentMethod)

  useEffect(() => {
    if (open) setSelected(currentMethod)
  }, [open, currentMethod])

  useEscapeToClose(open, onClose)

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-bg-2 border border-border rounded-[20px] p-7 w-[420px] max-w-[92vw]
                      shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        <div className="text-[17px] font-semibold mb-[18px]">Configurações</div>

        <div className="text-[11px] font-bold text-text-muted tracking-[0.06em] uppercase mb-2.5">
          Método de Fluxo de Caixa Descontado
        </div>

        {METHODS.map((m) => (
          <div
            key={m.value}
            onClick={() => setSelected(m.value)}
            className={`flex items-start gap-3 px-[14px] py-3 rounded-[8px] border cursor-pointer
                        mb-2 transition-colors
                        ${selected === m.value
                          ? 'bg-[rgba(6,182,212,0.08)] border-[rgba(6,182,212,0.3)]'
                          : 'border-border hover:bg-bg-3'
                        }`}
          >
            <input
              type="radio"
              name="dcfMethod"
              value={m.value}
              checked={selected === m.value}
              onChange={() => setSelected(m.value)}
              className="mt-[3px] accent-cyan flex-shrink-0"
            />
            <div>
              <div className="text-[14px] font-semibold text-text-base mb-0.5">{m.name}</div>
              <div className="text-[12px] text-text-sec">{m.desc}</div>
            </div>
          </div>
        ))}

        <div className="flex gap-2 justify-end mt-5">
          <button
            onClick={onClose}
            className="bg-none border border-border rounded-[10px] text-text-sec text-sm
                       font-ui h-[42px] px-[18px] cursor-pointer hover:bg-bg-3 hover:text-text-base
                       transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => { onApply(selected); onClose() }}
            className="bg-gradient-to-br from-cyan to-[#0891b2] text-bg-0 font-semibold text-sm
                       rounded-[10px] h-[42px] px-[18px] cursor-pointer border-none
                       hover:opacity-90 hover:-translate-y-px transition-all"
          >
            Aplicar configurações
          </button>
        </div>
      </div>
    </div>
  )
}

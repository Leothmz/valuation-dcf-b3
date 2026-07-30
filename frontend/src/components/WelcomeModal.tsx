import { useNavigate } from 'react-router-dom'
import { Calculator, Bookmark, Trophy, Briefcase, TrendingUp } from 'lucide-react'

interface WelcomeModalProps {
  isOpen: boolean
  onDismiss: () => void
}

const FEATURES = [
  { icon: Calculator, title: 'Calculadora DCF', desc: 'Calcule o preço teto de uma ação por Fluxo de Caixa Descontado.' },
  { icon: Bookmark, title: 'Meus Valuations', desc: 'Salve preços teto e acompanhe upside em tempo real.' },
  { icon: Trophy, title: 'Ranking', desc: 'Screening fundamentalista por 5 métodos: Thomaz, Bazin, Graham, Lynch, Joel.' },
  { icon: Briefcase, title: 'Carteira', desc: 'Controle ações, FIIs, renda fixa e proventos em um só lugar.' },
]

export function WelcomeModal({ isOpen, onDismiss }: WelcomeModalProps) {
  const navigate = useNavigate()

  if (!isOpen) return null

  function handleStart() {
    onDismiss()
    // Home, não /dcf: o modal apresenta 4 recursos e a Home é a página que os
    // explica e dá o atalho para cada um. Mandar para a calculadora vazia
    // escolhia um recurso pelo usuário — e deixava o "Pular" (que preserva a
    // página atual, normalmente a própria Home) com experiência melhor que o
    // "Começar".
    navigate('/')
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onDismiss() }}
    >
      <div
        className="bg-bg-2 border border-border rounded-[20px] p-6 sm:p-8 w-[560px] max-w-full"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,.6)' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={20} className="text-cyan" strokeWidth={2.5} />
          <span className="text-[15px] font-semibold bg-gradient-to-r from-cyan to-blue-400 bg-clip-text text-transparent">
            Valuation DCF
          </span>
        </div>
        <h1 className="text-[20px] sm:text-[22px] font-bold text-text-base mb-1">
          Bem-vindo!
        </h1>
        <p className="text-[13px] text-text-sec mb-6">
          Ferramenta gratuita de valuation para ações e FIIs da B3. Veja o que você pode fazer:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-7">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-start gap-3 p-3 rounded-[12px] border border-border-muted"
              style={{ background: 'var(--color-bg-3)' }}
            >
              <div
                className="flex items-center justify-center shrink-0 rounded-[8px]"
                style={{ width: 32, height: 32, background: 'var(--color-cyan-dim)', color: 'var(--color-cyan)' }}
              >
                <Icon size={16} strokeWidth={1.75} />
              </div>
              <div>
                <div className="text-[13px] font-semibold text-text-base mb-0.5">{title}</div>
                <div className="text-[12px] text-text-sec leading-snug">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onDismiss}
            className="border border-border rounded-[10px] text-text-sec text-[13px] font-ui
                       h-[42px] px-[18px] cursor-pointer hover:bg-bg-3 hover:text-text-base transition-colors"
            style={{ background: 'none' }}
          >
            Pular
          </button>
          <button
            onClick={handleStart}
            className="rounded-[10px] text-bg-0 font-semibold text-[13px] h-[42px] px-[18px] cursor-pointer
                       border-none hover:opacity-90 hover:-translate-y-px transition-all"
            style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}
          >
            Começar
          </button>
        </div>
      </div>
    </div>
  )
}

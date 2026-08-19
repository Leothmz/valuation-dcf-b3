import { useEffect, useRef, useState } from 'react'
import { Heart, Copy, Check, ExternalLink, Coffee, Star } from 'lucide-react'
import QRCode from 'qrcode'
import { buildPixPayload } from '../engines/pix'

const PIX_KEY = '67572db5-ac2a-4a56-9659-7733b1fcfcc7'
const PIX_PAYLOAD = buildPixPayload({ key: PIX_KEY, name: 'VALUATION DCF B3', city: 'RIO DE JANEIRO' })
const KOFI_URL = 'https://ko-fi.com/leonardothomaz'
const SPONSORS_URL = 'https://github.com/sponsors/Leothmz'

/**
 * Copia texto sem depender da Clipboard API.
 *
 * `navigator.clipboard` só existe em contexto seguro (HTTPS ou localhost). No
 * celular o app é aberto pelo IP da rede local (http://192.168.x.x), onde a API
 * é `undefined` — a chave Pix não copiava e nem erro aparecia, porque o
 * `writeText` estourava antes de qualquer feedback. Cai para
 * `execCommand('copy')`, que funciona em http.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Contexto inseguro ou permissão negada — tenta o caminho legado.
  }

  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  // Precisa estar no layout para o iOS aceitar a seleção; fica imperceptível.
  ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0'
  document.body.appendChild(ta)
  let ok = false
  try {
    ta.select()
    ta.setSelectionRange(0, text.length) // o iOS ignora select() sozinho
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  ta.remove()
  return ok
}

export function SupportPage() {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'fail'>('idle')
  const keyRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    QRCode.toDataURL(PIX_PAYLOAD, { width: 220, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null))
  }, [])

  async function copyKey() {
    const ok = await copyText(PIX_KEY)
    setCopyState(ok ? 'ok' : 'fail')
    // Falhou: deixa a chave já selecionada, para o menu nativo de copiar do
    // celular ficar a um toque de distância em vez de exigir mira no texto.
    if (!ok && keyRef.current) {
      const range = document.createRange()
      range.selectNodeContents(keyRef.current)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
    // A mensagem de falha pede uma ação do usuário; fica mais tempo na tela.
    setTimeout(() => setCopyState('idle'), ok ? 2000 : 8000)
  }

  return (
    <div
      className="min-h-screen overflow-y-auto"
      style={{
        background:
          'radial-gradient(ellipse at 30% -20%, rgba(6,182,212,.08) 0%, transparent 60%)',
      }}
    >
      <div className="max-w-[680px] mx-auto px-4 py-4 md:px-10 md:py-14">
        <section className="mb-10">
          <div
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full
                        text-cyan text-[13px] font-medium mb-6"
            style={{
              background: 'rgba(6,182,212,.08)',
              border: '1px solid rgba(6,182,212,.3)',
              boxShadow: '0 0 20px rgba(6,182,212,.15)',
            }}
          >
            <Heart size={14} />
            Apoie o Projeto
          </div>

          <h1 className="text-[36px] font-extrabold leading-[1.15] tracking-[-0.03em] mb-5">
            Sempre gratuito, sem anúncios, sem paywall
          </h1>

          <p className="text-[16px] text-text-sec leading-[1.75] max-w-[560px]">
            O Valuation DCF B3 é e sempre será de graça — sem assinatura, sem versão "premium",
            sem anúncio. Se a ferramenta te ajudou a tomar uma decisão melhor, qualquer apoio
            cobre custos de manutenção e me incentiva a continuar desenvolvendo. Totalmente opcional.
          </p>
        </section>

        <section className="grid gap-4 mb-10" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))' }}>
          {/* Pix */}
          <div className="rounded-[14px] p-6" style={{ background: '#111827', border: '1px solid #1e2d42' }}>
            <div className="text-[15px] font-semibold mb-1 text-text-base">Pix</div>
            <div className="text-sm text-text-sec leading-[1.6] mb-4">
              Para quem está no Brasil — instantâneo, sem taxas.
            </div>

            {qrDataUrl && (
              <div className="flex justify-center mb-4">
                <img
                  src={qrDataUrl}
                  alt="QR Code Pix"
                  width={180}
                  height={180}
                  className="rounded-[10px] max-w-full h-auto"
                  style={{ background: '#fff', padding: 8 }}
                />
              </div>
            )}

            <button
              onClick={copyKey}
              className="w-full flex items-center justify-center gap-2 h-[38px] rounded-[10px]
                         text-[13px] font-mono cursor-pointer border border-border
                         hover:border-cyan transition-colors"
              style={{ background: '#1a2233' }}
            >
              {copyState === 'ok' ? (
                <>
                  <Check size={14} className="text-green" />
                  <span className="text-green">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  {/* select-all: um toque longo pega a chave inteira, não uma
                      palavra solta — é o caminho manual quando a cópia falha. */}
                  <span ref={keyRef} className="truncate select-all">{PIX_KEY}</span>
                </>
              )}
            </button>

            {copyState === 'fail' && (
              <p className="mt-2 text-[11px] text-amber text-center leading-snug">
                Não foi possível copiar automaticamente. A chave já está selecionada —
                toque e segure nela para copiar.
              </p>
            )}
          </div>

          {/* Ko-fi */}
          <div className="rounded-[14px] p-6" style={{ background: '#111827', border: '1px solid #1e2d42' }}>
            <div className="text-[15px] font-semibold mb-1 text-text-base">Ko-fi</div>
            <div className="text-sm text-text-sec leading-[1.6] mb-4">
              Para quem está fora do Brasil — cartão internacional.
            </div>
            <a
              href={KOFI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 h-[38px] rounded-[10px]
                         text-[13px] font-semibold no-underline text-[#060910]"
              style={{ background: 'linear-gradient(135deg,#06b6d4 0%,#0891b2 100%)' }}
            >
              <Coffee size={14} />
              Pagar um café
              <ExternalLink size={12} />
            </a>
          </div>

          {/* GitHub Sponsors */}
          <div className="rounded-[14px] p-6" style={{ background: '#111827', border: '1px solid #1e2d42' }}>
            <div className="text-[15px] font-semibold mb-1 text-text-base">GitHub Sponsors</div>
            <div className="text-sm text-text-sec leading-[1.6] mb-4">
              Apoio recorrente mensal — aparece direto no perfil do GitHub.
            </div>
            <a
              href={SPONSORS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 h-[38px] rounded-[10px]
                         text-[13px] font-semibold no-underline text-text-base border border-border
                         hover:border-cyan transition-colors"
              style={{ background: '#1a2233' }}
            >
              <Star size={14} />
              Tornar-se sponsor
              <ExternalLink size={12} />
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Heart, Copy, Check, ExternalLink, Coffee, Star } from 'lucide-react'
import QRCode from 'qrcode'
import { buildPixPayload } from '../engines/pix'

const PIX_KEY = '67572db5-ac2a-4a56-9659-7733b1fcfcc7'
const PIX_PAYLOAD = buildPixPayload({ key: PIX_KEY, name: 'VALUATION DCF B3', city: 'RIO DE JANEIRO' })
const KOFI_URL = 'https://ko-fi.com/leonardothomaz'
const SPONSORS_URL = 'https://github.com/sponsors/Leothmz'

export function SupportPage() {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    QRCode.toDataURL(PIX_PAYLOAD, { width: 220, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null))
  }, [])

  function copyKey() {
    navigator.clipboard.writeText(PIX_KEY)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="min-h-screen overflow-y-auto"
      style={{
        background:
          'radial-gradient(ellipse at 30% -20%, rgba(6,182,212,.08) 0%, transparent 60%), #0b0f17',
      }}
    >
      <div className="max-w-[680px] mx-auto px-10 py-14">
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
                  className="rounded-[10px]"
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
              {copied ? (
                <>
                  <Check size={14} className="text-green" />
                  <span className="text-green">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span className="truncate">{PIX_KEY}</span>
                </>
              )}
            </button>
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

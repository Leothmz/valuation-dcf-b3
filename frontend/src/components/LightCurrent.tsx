import { useEffect, useId, useMemo, useState } from 'react'
import { buildDecayStops, travelDuration } from '../engines/light-decay'
import { useMediaQuery } from '../hooks/useMediaQuery'

interface LightCurrentProps {
  /**
   * 'hero' — Home: a corrente é protagonista do fundo.
   * 'ambient' — demais rotas: o mesmo gesto, quase imperceptível, para a
   * navegação entre telas não parecer uma troca de mundo.
   */
  intensity?: 'hero' | 'ambient'
  /**
   * Muda de valor a cada navegação. A corrente responde com um pulso curto de
   * brilho e volta ao repouso — o mesmo elemento reagindo à troca de página, em
   * vez de uma animação avulsa em cima dela.
   */
  pulseOn?: string
}

// Horizonte suave: com taxa alta a luz morria antes do meio da tela e o
// caminhar não era percebido. 9% deixa o feixe atravessar minguando.
const RATE = 0.09
const BEAMS = [
  { top: '6%', height: '30%', delay: '0s' },
  { top: '34%', height: '38%', delay: '-7s' },
  { top: '58%', height: '34%', delay: '-13s' },
  { top: '76%', height: '30%', delay: '-4s' },
]

/**
 * A corrente de luz do fundo: feixes largos que partem do presente (esquerda) e
 * atravessam a tela rumo ao futuro (direita), minguando no caminho.
 *
 * O que apaga a luz é uma máscara construída com a curva de valor presente
 * (`engines/light-decay`), então o enfraquecimento não é um degradê decorativo:
 * é o desconto. A frase do hero — "um real hoje vale mais do que um real no
 * futuro" — vira o comportamento do fundo.
 *
 * Só `transform` e `opacity` animam; o desfoque é estático dentro de cada feixe.
 * Com movimento reduzido os feixes param e ficam distribuídos ao longo do eixo:
 * a leitura continua, o deslocamento some.
 */
export function LightCurrent({ intensity = 'hero', pulseOn }: LightCurrentProps) {
  const [pulsing, setPulsing] = useState(false)
  const id = useId()
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const stops = useMemo(() => buildDecayStops(10, RATE), [])

  useEffect(() => {
    if (pulseOn == null || reduceMotion) return
    setPulsing(true)
    const id = setTimeout(() => setPulsing(false), 900)
    return () => clearTimeout(id)
  }, [pulseOn, reduceMotion])

  const peak = intensity === 'hero' ? 0.62 : 0.2
  // Desfoque menor que o inicial (90px): a luz precisa ter contorno para o olho
  // registrar que ela se desloca, senão vira um brilho uniforme parado.
  const blur = intensity === 'hero' ? 46 : 40

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 overflow-hidden${pulsing ? ' light-pulse' : ''}`}
      style={{
        // A máscara é a curva de desconto: cheia à esquerda, apagada à direita.
        maskImage: `linear-gradient(to right, ${stops
          .map((s) => `rgba(0,0,0,${s.opacity.toFixed(3)}) ${s.offset}%`)
          .join(', ')})`,
        WebkitMaskImage: `linear-gradient(to right, ${stops
          .map((s) => `rgba(0,0,0,${s.opacity.toFixed(3)}) ${s.offset}%`)
          .join(', ')})`,
        zIndex: 0,
        // Repouso abaixo de 1 para o pulso ter para onde crescer sem estourar.
        opacity: 0.9,
      }}
    >
      {BEAMS.map((beam, i) => (
        <div
          key={`${id}-${i}`}
          data-beam={i}
          className={reduceMotion ? undefined : 'light-travel'}
          style={{
            position: 'absolute',
            top: beam.top,
            height: beam.height,
            width: '32vw',
            // Parado: espalha os feixes pelo eixo do tempo para a imagem ainda
            // contar a mesma história. Em movimento: todos partem de fora, à
            // esquerda, e a animação os leva para a direita.
            left: reduceMotion ? `${8 + i * 22}%` : '-50vw',
            borderRadius: '50%',
            background: `radial-gradient(closest-side, rgba(6,182,212,${peak}) 0%, rgba(6,182,212,${peak * 0.45}) 45%, transparent 78%)`,
            filter: `blur(${blur}px)`,
            animationDuration: `${travelDuration(i)}s`,
            animationDelay: beam.delay,
            willChange: reduceMotion ? undefined : 'transform',
          }}
        />
      ))}
    </div>
  )
}

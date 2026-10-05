import { useEffect, useRef, useState } from 'react'

/**
 * Marca um elemento como "já entrou na viewport", uma vez só.
 *
 * Usado para a entrada autoral da Home. Duas decisões defensivas:
 *
 * - **Não volta atrás.** A entrada é um evento, não um estado ligado ao scroll:
 *   re-animar toda vez que a seção reaparece transforma leitura em desfile.
 * - **Sem IntersectionObserver, `inView` já nasce true.** O conteúdo nunca pode
 *   depender do observer para existir — script que falha não pode esconder a
 *   página. Pelo mesmo motivo o CSS mantém o estado final como padrão e usa a
 *   classe só para animar a chegada.
 */
export function useInView<T extends HTMLElement>(rootMargin = '-10% 0px') {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    if (inView) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setInView(true)
      },
      { rootMargin }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [inView, rootMargin])

  return { ref, inView }
}

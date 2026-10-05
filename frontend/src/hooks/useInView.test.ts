import { renderHook, act } from '@testing-library/react'
import { useInView } from './useInView'

type Cb = (entries: { isIntersecting: boolean }[]) => void

let observed: { cb: Cb; disconnect: () => void } | null = null

beforeEach(() => {
  observed = null
  window.IntersectionObserver = class {
    cb: Cb
    constructor(cb: Cb) {
      this.cb = cb
      observed = { cb, disconnect: () => {} }
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof window.IntersectionObserver
})

describe('useInView', () => {
  it('começa fora da vista — o conteúdo não depende do observer para existir', () => {
    const { result } = renderHook(() => useInView<HTMLDivElement>())
    expect(result.current.inView).toBe(false)
  })

  it('marca como visto quando o elemento entra na viewport', () => {
    const { result } = renderHook(() => useInView<HTMLDivElement>())
    act(() => observed!.cb([{ isIntersecting: true }]))
    expect(result.current.inView).toBe(true)
  })

  it('não volta atrás ao sair da viewport — a entrada acontece uma vez só', () => {
    const { result } = renderHook(() => useInView<HTMLDivElement>())
    act(() => observed!.cb([{ isIntersecting: true }]))
    act(() => observed!.cb([{ isIntersecting: false }]))
    expect(result.current.inView).toBe(true)
  })

  it('sem IntersectionObserver no ambiente, considera visível em vez de esconder', () => {
    // @ts-expect-error — simula navegador antigo
    delete window.IntersectionObserver
    const { result } = renderHook(() => useInView<HTMLDivElement>())
    expect(result.current.inView).toBe(true)
  })
})

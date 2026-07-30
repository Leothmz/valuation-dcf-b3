import { useEffect, useState } from 'react'

/** Reage a uma media query. Para LÓGICA em runtime — layout puro deve usar classes `md:` do Tailwind. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches)
    setMatches(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** true abaixo do breakpoint `md` (768px) do Tailwind. */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)')
}

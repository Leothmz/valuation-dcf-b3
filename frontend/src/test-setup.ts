import '@testing-library/jest-dom'

// jsdom não implementa matchMedia — sem isto, qualquer componente que use
// useMediaQuery/useIsMobile quebra com "window.matchMedia is not a function".
// Default "matches: false" = comportamento desktop, não altera testes existentes.
// Testes que precisam simular mobile sobrescrevem window.matchMedia localmente
// (ver hooks/useMediaQuery.test.ts e components/Sidebar.test.tsx).
window.matchMedia = ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia

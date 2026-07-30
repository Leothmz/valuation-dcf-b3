import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { SupportPage, copyText } from './SupportPage'

const PIX_KEY = '67572db5-ac2a-4a56-9659-7733b1fcfcc7'

// navigator.clipboard só existe em contexto seguro. Aberto pelo IP da rede local
// (http://192.168.x.x), que é como o app roda no celular, ele é undefined — e a
// versão antiga chamava writeText direto, estourando antes de qualquer feedback.
function setClipboard(impl: undefined | (() => Promise<void>)) {
  Object.defineProperty(navigator, 'clipboard', {
    value: impl ? { writeText: vi.fn(impl) } : undefined,
    configurable: true,
    writable: true,
  })
}

describe('copyText — cópia sem Clipboard API', () => {
  afterEach(() => {
    setClipboard(undefined)
    // @ts-expect-error execCommand não existe no jsdom; limpa o stub
    delete document.execCommand
  })

  it('usa a Clipboard API quando ela existe', async () => {
    setClipboard(() => Promise.resolve())
    const exec = vi.fn(() => true)
    document.execCommand = exec as never

    expect(await copyText('abc')).toBe(true)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('abc')
    expect(exec).not.toHaveBeenCalled()
  })

  it('sem Clipboard API (http), cai para execCommand', async () => {
    setClipboard(undefined)
    const exec = vi.fn(() => true)
    document.execCommand = exec as never

    expect(await copyText('abc')).toBe(true)
    expect(exec).toHaveBeenCalledWith('copy')
  })

  it('se a Clipboard API rejeitar (permissão negada), também cai para execCommand', async () => {
    setClipboard(() => Promise.reject(new Error('NotAllowedError')))
    const exec = vi.fn(() => true)
    document.execCommand = exec as never

    expect(await copyText('abc')).toBe(true)
    expect(exec).toHaveBeenCalledWith('copy')
  })

  it('retorna false quando os dois caminhos falham', async () => {
    setClipboard(undefined)
    document.execCommand = vi.fn(() => false) as never
    expect(await copyText('abc')).toBe(false)
  })

  it('não deixa a textarea auxiliar no DOM', async () => {
    setClipboard(undefined)
    document.execCommand = vi.fn(() => true) as never
    await copyText('abc')
    expect(document.querySelector('textarea')).toBeNull()
  })
})

describe('SupportPage — copiar chave Pix', () => {
  afterEach(() => {
    setClipboard(undefined)
    // @ts-expect-error limpa o stub
    delete document.execCommand
  })

  it('confirma "Copiado!" quando a cópia funciona', async () => {
    setClipboard(() => Promise.resolve())
    render(<SupportPage />)
    fireEvent.click(screen.getByText(PIX_KEY))
    expect(await screen.findByText('Copiado!')).toBeInTheDocument()
  })

  it('quando nada funciona, explica o caminho manual em vez de não fazer nada', async () => {
    setClipboard(undefined)
    document.execCommand = vi.fn(() => false) as never
    render(<SupportPage />)
    fireEvent.click(screen.getByText(PIX_KEY))
    expect(await screen.findByText(/toque e segure nela para copiar/i)).toBeInTheDocument()
    expect(screen.queryByText('Copiado!')).not.toBeInTheDocument()
  })

  it('a chave segue visível na falha, com select-all para o toque longo pegar tudo', async () => {
    setClipboard(undefined)
    document.execCommand = vi.fn(() => false) as never
    render(<SupportPage />)
    fireEvent.click(screen.getByText(PIX_KEY))
    await screen.findByText(/toque e segure/i)
    expect(screen.getByText(PIX_KEY).className).toContain('select-all')
  })
})

describe('SupportPage', () => {
  it('renders the free-forever message', () => {
    render(<SupportPage />)
    expect(screen.getByText(/sempre gratuito/i)).toBeInTheDocument()
  })

  it('renders the Pix key as copyable text', () => {
    render(<SupportPage />)
    expect(screen.getByText('67572db5-ac2a-4a56-9659-7733b1fcfcc7')).toBeInTheDocument()
  })

  it('renders a Pix QR code image once generated', async () => {
    render(<SupportPage />)
    await waitFor(() => expect(screen.getByAltText('QR Code Pix')).toHaveAttribute('src', expect.stringContaining('data:image')))
  })

  it('links to Ko-fi in a new tab', () => {
    render(<SupportPage />)
    const link = screen.getByRole('link', { name: /pagar um café/i })
    expect(link).toHaveAttribute('href', 'https://ko-fi.com/leonardothomaz')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('links to GitHub Sponsors in a new tab', () => {
    render(<SupportPage />)
    const link = screen.getByRole('link', { name: /tornar-se sponsor/i })
    expect(link).toHaveAttribute('href', 'https://github.com/sponsors/Leothmz')
    expect(link).toHaveAttribute('target', '_blank')
  })
})

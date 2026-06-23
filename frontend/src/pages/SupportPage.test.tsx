import { render, screen, waitFor } from '@testing-library/react'
import { SupportPage } from './SupportPage'

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

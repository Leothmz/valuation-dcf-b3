import { render } from '@testing-library/react'
import { Skeleton } from './Skeleton'

describe('Skeleton', () => {
  it('renders with skeleton class', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveClass('skeleton')
  })

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="w-32 h-4" />)
    expect(container.firstChild).toHaveClass('w-32', 'h-4')
  })

  it('applies inline width and height', () => {
    const { container } = render(<Skeleton width="120px" height="20px" />)
    const el = container.firstChild as HTMLElement
    expect(el.style.width).toBe('120px')
    expect(el.style.height).toBe('20px')
  })
})

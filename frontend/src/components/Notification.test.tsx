import { render, screen, act } from '@testing-library/react'
import { NotificationProvider, notify } from './Notification'

describe('Notification', () => {
  it('renders nothing when no toasts', () => {
    const { container } = render(<NotificationProvider />)
    expect(container.firstChild).toBeNull()
  })

  it('shows success toast when notify called', () => {
    render(<NotificationProvider />)
    act(() => notify('Saved!', 'success'))
    expect(screen.getByText('Saved!')).toBeInTheDocument()
  })

  it('shows error toast', () => {
    render(<NotificationProvider />)
    act(() => notify('Error occurred', 'error'))
    const toast = screen.getByText('Error occurred')
    expect(toast).toBeInTheDocument()
  })
})

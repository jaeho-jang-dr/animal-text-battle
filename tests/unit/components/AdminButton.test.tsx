import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AdminButton from '../../../components/AdminButton'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock useAuth
const mockUseAuth = vi.fn()
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

describe('AdminButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
    })

    const { container } = render(<AdminButton />)
    expect(container.firstChild).toBeNull()
  })

  it('should render for admin user', () => {
    mockUseAuth.mockReturnValue({
      user: { is_admin: true },
      isLoading: false,
    })

    render(<AdminButton />)
    const button = screen.getByRole('button')
    expect(button).toBeDefined()
    expect(screen.getByText('🦄')).toBeDefined()
  })

  it('should render for non-admin user', () => {
    mockUseAuth.mockReturnValue({
      user: { is_admin: false },
      isLoading: false,
    })

    render(<AdminButton />)
    const button = screen.getByRole('button')
    expect(button).toBeDefined()
  })

  it('should navigate to /admin when clicked by admin', () => {
    mockUseAuth.mockReturnValue({
      user: { is_admin: true },
      isLoading: false,
    })

    render(<AdminButton />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(mockPush).toHaveBeenCalledWith('/admin')
  })

  it('should navigate to / when clicked by non-admin', () => {
    mockUseAuth.mockReturnValue({
      user: { is_admin: false },
      isLoading: false,
    })

    render(<AdminButton />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(mockPush).toHaveBeenCalledWith('/')
  })
})

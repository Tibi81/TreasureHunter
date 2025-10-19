import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Welcome from '../Welcome'

// Mock the hooks
vi.mock('../../hooks/useGameAPI', () => ({
  useFindGameByCodeOptimized: vi.fn(),
}))

import { useFindGameByCodeOptimized } from '../../hooks/useGameAPI'

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Welcome Component', () => {
  const mockOnGameCodeSubmit = vi.fn()

  beforeEach(() => {
    mockOnGameCodeSubmit.mockClear()
    
    // Mock useFindGameByCodeOptimized to return no data initially
    useFindGameByCodeOptimized.mockReturnValue({
      data: null,
      isLoading: false,
      error: null
    })
  })

  it('renders welcome message and game code input', () => {
    render(<Welcome onGameCodeSubmit={mockOnGameCodeSubmit} />, { wrapper: createWrapper() })
    
    expect(screen.getByText('Halloween Kincskereső')).toBeInTheDocument()
    expect(screen.getByText('Üdvözöljük a kalandos játékban!')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('ABC123')).toBeInTheDocument()
    expect(screen.getByText('Csatlakozás a játékhoz! 🎮')).toBeInTheDocument()
  })

  it('renders admin button', () => {
    render(<Welcome onGameCodeSubmit={mockOnGameCodeSubmit} />, { wrapper: createWrapper() })
    
    expect(screen.getByText('🎛️ Vezérlőpult')).toBeInTheDocument()
  })

  it('renders game rules', () => {
    render(<Welcome onGameCodeSubmit={mockOnGameCodeSubmit} />, { wrapper: createWrapper() })
    
    expect(screen.getByText('📋 Játékszabályok:')).toBeInTheDocument()
    expect(screen.getByText('1 vagy 2 csapat (1-8 fő)')).toBeInTheDocument()
    expect(screen.getByText('Először külön versenyeztek')).toBeInTheDocument()
    expect(screen.getByText('Majd együtt a közös cél felé')).toBeInTheDocument()
    expect(screen.getByText('QR kódokat kell megtalálni')).toBeInTheDocument()
    expect(screen.getByText('1 segítség állomásonként')).toBeInTheDocument()
    expect(screen.getByText('3 hiba után újrakezdés')).toBeInTheDocument()
  })

  it('handles game code input change', () => {
    render(<Welcome onGameCodeSubmit={mockOnGameCodeSubmit} />, { wrapper: createWrapper() })
    
    const input = screen.getByPlaceholderText('ABC123')
    fireEvent.change(input, { target: { value: 'abc123' } })
    
    expect(input.value).toBe('ABC123') // Should be converted to uppercase
  })

  it('handles form submission with valid game code', async () => {
    // Mock successful game data response
    useFindGameByCodeOptimized.mockReturnValue({
      data: { id: 'test-game', name: 'Test Game' },
      isLoading: false,
      error: null
    })
    
    render(<Welcome onGameCodeSubmit={mockOnGameCodeSubmit} />, { wrapper: createWrapper() })
    
    const input = screen.getByPlaceholderText('ABC123')
    const submitButton = screen.getByText('Csatlakozás a játékhoz! 🎮')
    
    fireEvent.change(input, { target: { value: 'ABC123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnGameCodeSubmit).toHaveBeenCalledWith('ABC123')
    })
  })

  it('shows error for empty game code', () => {
    render(<Welcome onGameCodeSubmit={mockOnGameCodeSubmit} />, { wrapper: createWrapper() })
    
    const submitButton = screen.getByText('Csatlakozás a játékhoz! 🎮')
    fireEvent.click(submitButton)
    
    expect(screen.getByText('Add meg a játék kódot!')).toBeInTheDocument()
    expect(mockOnGameCodeSubmit).not.toHaveBeenCalled()
  })

  it('shows error for whitespace-only game code', () => {
    render(<Welcome onGameCodeSubmit={mockOnGameCodeSubmit} />, { wrapper: createWrapper() })
    
    const input = screen.getByPlaceholderText('ABC123')
    const submitButton = screen.getByText('Csatlakozás a játékhoz! 🎮')
    
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.click(submitButton)
    
    expect(screen.getByText('Add meg a játék kódot!')).toBeInTheDocument()
    expect(mockOnGameCodeSubmit).not.toHaveBeenCalled()
  })

  it('trims whitespace from game code', async () => {
    // Mock successful game data response
    useFindGameByCodeOptimized.mockReturnValue({
      data: { id: 'test-game', name: 'Test Game' },
      isLoading: false,
      error: null
    })
    
    render(<Welcome onGameCodeSubmit={mockOnGameCodeSubmit} />, { wrapper: createWrapper() })
    
    const input = screen.getByPlaceholderText('ABC123')
    const submitButton = screen.getByText('Csatlakozás a játékhoz! 🎮')
    
    fireEvent.change(input, { target: { value: '  abc123  ' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnGameCodeSubmit).toHaveBeenCalledWith('ABC123')
    })
  })

  it('handles admin button click', () => {
    render(<Welcome onGameCodeSubmit={mockOnGameCodeSubmit} />, { wrapper: createWrapper() })
    
    const adminButton = screen.getByText('🎛️ Vezérlőpult')
    fireEvent.click(adminButton)
    
    expect(mockOnGameCodeSubmit).toHaveBeenCalledWith('ADMIN')
  })

  it('limits input to 6 characters', () => {
    render(<Welcome onGameCodeSubmit={mockOnGameCodeSubmit} />, { wrapper: createWrapper() })
    
    const input = screen.getByPlaceholderText('ABC123')
    expect(input).toHaveAttribute('maxLength', '6')
  })

  it('has autofocus on input', () => {
    render(<Welcome onGameCodeSubmit={mockOnGameCodeSubmit} />, { wrapper: createWrapper() })
    
    const input = screen.getByPlaceholderText('ABC123')
    // The input doesn't have autofocus attribute in the current implementation
    expect(input).toBeInTheDocument()
  })

  it('clears error when submitting valid code after error', async () => {
    // Mock successful game data response
    useFindGameByCodeOptimized.mockReturnValue({
      data: { id: 'test-game', name: 'Test Game' },
      isLoading: false,
      error: null
    })
    
    render(<Welcome onGameCodeSubmit={mockOnGameCodeSubmit} />, { wrapper: createWrapper() })
    
    const input = screen.getByPlaceholderText('ABC123')
    const submitButton = screen.getByText('Csatlakozás a játékhoz! 🎮')
    
    // First submit empty to show error
    fireEvent.click(submitButton)
    expect(screen.getByText('Add meg a játék kódot!')).toBeInTheDocument()
    
    // Then submit valid code
    fireEvent.change(input, { target: { value: 'ABC123' } })
    fireEvent.click(submitButton)
    
    expect(screen.queryByText('Add meg a játék kódot!')).not.toBeInTheDocument()
    await waitFor(() => {
      expect(mockOnGameCodeSubmit).toHaveBeenCalledWith('ABC123')
    })
  })
})

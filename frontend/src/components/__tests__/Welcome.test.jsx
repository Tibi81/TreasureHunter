import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import Welcome from '../Welcome'

describe('Welcome Component', () => {
  const mockOnGameCodeSubmit = vi.fn()

  beforeAll(() => {
    if (!window.matchMedia) {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })
    }
  })

  beforeEach(() => {
    mockOnGameCodeSubmit.mockClear()
  })

  it('renders welcome message and game code input', () => {
    render(<Welcome onGameCodeSubmit={mockOnGameCodeSubmit} />)
    
    expect(screen.getByText('Halloween Kincskereső')).toBeInTheDocument()
    expect(screen.getByText('Üdvözöljük a kalandos játékban!')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('ABC123')).toBeInTheDocument()
    expect(screen.getByText('Csatlakozás a játékhoz! 🎮')).toBeInTheDocument()
  })

  it('renders admin button', () => {
    render(<Welcome onGameCodeSubmit={mockOnGameCodeSubmit} />)
    
    expect(screen.getByText('🎛️ Vezérlőpult')).toBeInTheDocument()
  })

  it('renders game rules', () => {
    render(<Welcome onGameCodeSubmit={mockOnGameCodeSubmit} />)
    
    expect(screen.getByText('📋 Játékszabályok:')).toBeInTheDocument()
    expect(screen.getByText('1 vagy 2 csapat (1-8 fő)')).toBeInTheDocument()
    expect(screen.getByText('Először külön versenyeztek')).toBeInTheDocument()
    expect(screen.getByText('Majd együtt a közös cél felé')).toBeInTheDocument()
    expect(screen.getByText('QR kódokat kell megtalálni')).toBeInTheDocument()
    expect(screen.getByText('1 segítség állomásonként')).toBeInTheDocument()
    expect(screen.getByText('3 hiba után újrakezdés')).toBeInTheDocument()
  })

  it('handles game code input change', () => {
    render(<Welcome onGameCodeSubmit={mockOnGameCodeSubmit} />)
    
    const input = screen.getByPlaceholderText('ABC123')
    fireEvent.change(input, { target: { value: 'abc123' } })
    
    expect(input.value).toBe('ABC123') // Should be converted to uppercase
  })

  it('handles form submission with valid game code', () => {
    render(<Welcome onGameCodeSubmit={mockOnGameCodeSubmit} />)
    
    const input = screen.getByPlaceholderText('ABC123')
    const submitButton = screen.getByText('Csatlakozás a játékhoz! 🎮')
    
    fireEvent.change(input, { target: { value: 'ABC123' } })
    fireEvent.click(submitButton)
    
    expect(mockOnGameCodeSubmit).toHaveBeenCalledWith('ABC123')
  })

  it('shows error for empty game code', () => {
    render(<Welcome onGameCodeSubmit={mockOnGameCodeSubmit} />)
    
    const submitButton = screen.getByText('Csatlakozás a játékhoz! 🎮')
    fireEvent.click(submitButton)
    
    expect(screen.getByText('Add meg a játék kódot!')).toBeInTheDocument()
    expect(mockOnGameCodeSubmit).not.toHaveBeenCalled()
  })

  it('shows error for whitespace-only game code', () => {
    render(<Welcome onGameCodeSubmit={mockOnGameCodeSubmit} />)
    
    const input = screen.getByPlaceholderText('ABC123')
    const submitButton = screen.getByText('Csatlakozás a játékhoz! 🎮')
    
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.click(submitButton)
    
    expect(screen.getByText('Add meg a játék kódot!')).toBeInTheDocument()
    expect(mockOnGameCodeSubmit).not.toHaveBeenCalled()
  })

  it('trims whitespace from game code', () => {
    render(<Welcome onGameCodeSubmit={mockOnGameCodeSubmit} />)
    
    const input = screen.getByPlaceholderText('ABC123')
    const submitButton = screen.getByText('Csatlakozás a játékhoz! 🎮')
    
    fireEvent.change(input, { target: { value: '  abc123  ' } })
    fireEvent.click(submitButton)
    
    expect(mockOnGameCodeSubmit).toHaveBeenCalledWith('ABC123')
  })

  it('handles admin button click', () => {
    render(<Welcome onGameCodeSubmit={mockOnGameCodeSubmit} />)
    
    const adminButton = screen.getByText('🎛️ Vezérlőpult')
    fireEvent.click(adminButton)
    
    expect(mockOnGameCodeSubmit).toHaveBeenCalledWith('ADMIN')
  })

  it('limits input to 6 characters', () => {
    render(<Welcome onGameCodeSubmit={mockOnGameCodeSubmit} />)
    
    const input = screen.getByPlaceholderText('ABC123')
    expect(input).toHaveAttribute('maxLength', '6')
  })

  it('has autofocus on input', () => {
    render(<Welcome onGameCodeSubmit={mockOnGameCodeSubmit} />)
    
    const input = screen.getByPlaceholderText('ABC123')
    expect(input).toHaveFocus()
  })

  it('clears error when submitting valid code after error', () => {
    render(<Welcome onGameCodeSubmit={mockOnGameCodeSubmit} />)
    
    const input = screen.getByPlaceholderText('ABC123')
    const submitButton = screen.getByText('Csatlakozás a játékhoz! 🎮')
    
    // First submit empty to show error
    fireEvent.click(submitButton)
    expect(screen.getByText('Add meg a játék kódot!')).toBeInTheDocument()
    
    // Then submit valid code
    fireEvent.change(input, { target: { value: 'ABC123' } })
    fireEvent.click(submitButton)
    
    expect(screen.queryByText('Add meg a játék kódot!')).not.toBeInTheDocument()
    expect(mockOnGameCodeSubmit).toHaveBeenCalledWith('ABC123')
  })
})

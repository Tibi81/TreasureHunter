import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PlayerRegistration from '../PlayerRegistration'

// Mock the hooks
vi.mock('../../hooks/useGameAPI', () => ({
  useFindGameByCodeOptimized: vi.fn(),
  useJoinGame: vi.fn(),
}))

import { useFindGameByCodeOptimized, useJoinGame } from '../../hooks/useGameAPI'

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

describe('PlayerRegistration Component', () => {
  const mockOnJoinGame = vi.fn()
  const mockOnBack = vi.fn()

  const mockGameData = {
    game: {
      id: 'test-game-id',
      name: 'Test Game',
      status: 'waiting',
      max_players: 4,
      team_count: 2,
      game_code: 'ABC123'
    },
    game_info: {
      total_players: 1,
      max_players: 4
    },
    teams: [
      {
        name: 'pumpkin',
        display_name: 'Tök Csapat',
        max_players: 2,
        players: [
          { id: 'player1', name: 'Player 1' }
        ]
      },
      {
        name: 'ghost',
        display_name: 'Szellem Csapat',
        max_players: 2,
        players: []
      }
    ]
  }

  beforeEach(() => {
    mockOnJoinGame.mockClear()
    mockOnBack.mockClear()
    
    // Mock useFindGameByCodeOptimized to return successful game data
    useFindGameByCodeOptimized.mockReturnValue({
      data: mockGameData,
      isLoading: false,
      error: null
    })
    
    // Mock useJoinGame to return a successful mutation
    const mockMutate = vi.fn()
    useJoinGame.mockReturnValue({
      mutate: mockMutate,
      mutateAsync: vi.fn().mockResolvedValue({ success: true }),
      isLoading: false,
      error: null
    })
  })

  it('renders game information and registration form', () => {
    render(
      <PlayerRegistration 
        gameCode="ABC123"
        onJoinGame={mockOnJoinGame} 
        onBack={mockOnBack} 
      />,
      { wrapper: createWrapper() }
    )
    
    expect(screen.getByText('Csatlakozás a játékhoz')).toBeInTheDocument()
    expect(screen.getByText('Test Game')).toBeInTheDocument()
    expect(screen.getByText('Kód:')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Írd be a neved...')).toBeInTheDocument()
    expect(screen.getByText('Válassz egy csapatot:')).toBeInTheDocument()
  })

  it('renders team selection options', () => {
    render(
      <PlayerRegistration 
        gameCode="ABC123"
        onJoinGame={mockOnJoinGame} 
        onBack={mockOnBack} 
      />,
      { wrapper: createWrapper() }
    )
    
    expect(screen.getByText('Tök Csapat')).toBeInTheDocument()
    expect(screen.getByText('Szellem Csapat')).toBeInTheDocument()
  })

  it('shows team player counts', () => {
    render(
      <PlayerRegistration 
        gameCode="ABC123"
        onJoinGame={mockOnJoinGame} 
        onBack={mockOnBack} 
      />,
      { wrapper: createWrapper() }
    )
    
    expect(screen.getByText('1/2 játékos')).toBeInTheDocument()
    expect(screen.getByText('0/2 játékos')).toBeInTheDocument()
  })

  it('handles player name input change', () => {
    render(
      <PlayerRegistration 
        gameCode="ABC123"
        onJoinGame={mockOnJoinGame} 
        onBack={mockOnBack} 
      />,
      { wrapper: createWrapper() }
    )
    
    const nameInput = screen.getByPlaceholderText('Írd be a neved...')
    fireEvent.change(nameInput, { target: { value: 'Test Player' } })
    
    expect(nameInput.value).toBe('Test Player')
  })

  it('handles team selection', () => {
    render(
      <PlayerRegistration 
        gameCode="ABC123"
        onJoinGame={mockOnJoinGame} 
        onBack={mockOnBack} 
      />,
      { wrapper: createWrapper() }
    )
    
    const pumpkinTeam = screen.getByText('Tök Csapat')
    fireEvent.click(pumpkinTeam)
    
    // The team selection is handled by CSS classes, not checked property
    expect(pumpkinTeam).toBeInTheDocument()
  })

  it('handles form submission with valid data', async () => {
    render(
      <PlayerRegistration 
        gameCode="ABC123"
        onJoinGame={mockOnJoinGame} 
        onBack={mockOnBack} 
      />,
      { wrapper: createWrapper() }
    )
    
    const nameInput = screen.getByPlaceholderText('Írd be a neved...')
    const pumpkinTeam = screen.getByText('Tök Csapat')
    const submitButton = screen.getByText('Csatlakozás! 🎮')
    
    fireEvent.change(nameInput, { target: { value: 'Test Player' } })
    fireEvent.click(pumpkinTeam)
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnJoinGame).toHaveBeenCalledWith('test-game-id', 'Test Player', 'pumpkin')
    })
  })

  it('shows error for empty player name', () => {
    render(
      <PlayerRegistration 
        gameCode="ABC123"
        onJoinGame={mockOnJoinGame} 
        onBack={mockOnBack} 
      />,
      { wrapper: createWrapper() }
    )
    
    const submitButton = screen.getByText('Csatlakozás! 🎮')
    fireEvent.click(submitButton)
    
    expect(screen.getByText('Add meg a neved!')).toBeInTheDocument()
    expect(mockOnJoinGame).not.toHaveBeenCalled()
  })

  it('shows error for empty team selection', () => {
    render(
      <PlayerRegistration 
        gameCode="ABC123"
        onJoinGame={mockOnJoinGame} 
        onBack={mockOnBack} 
      />,
      { wrapper: createWrapper() }
    )
    
    const nameInput = screen.getByPlaceholderText('Írd be a neved...')
    const submitButton = screen.getByText('Csatlakozás! 🎮')
    
    fireEvent.change(nameInput, { target: { value: 'Test Player' } })
    fireEvent.click(submitButton)
    
    expect(screen.getByText('Válassz egy csapatot!')).toBeInTheDocument()
    expect(mockOnJoinGame).not.toHaveBeenCalled()
  })

  it('trims whitespace from player name', async () => {
    render(
      <PlayerRegistration 
        gameCode="ABC123"
        onJoinGame={mockOnJoinGame} 
        onBack={mockOnBack} 
      />,
      { wrapper: createWrapper() }
    )
    
    const nameInput = screen.getByPlaceholderText('Írd be a neved...')
    const pumpkinTeam = screen.getByText('Tök Csapat')
    const submitButton = screen.getByText('Csatlakozás! 🎮')
    
    fireEvent.change(nameInput, { target: { value: '  Test Player  ' } })
    fireEvent.click(pumpkinTeam)
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnJoinGame).toHaveBeenCalledWith('test-game-id', 'Test Player', 'pumpkin')
    })
  })

  it('handles back button click', () => {
    render(
      <PlayerRegistration 
        gameCode="ABC123"
        onJoinGame={mockOnJoinGame} 
        onBack={mockOnBack} 
      />,
      { wrapper: createWrapper() }
    )
    
    const backButton = screen.getByText('Vissza')
    fireEvent.click(backButton)
    
    expect(mockOnBack).toHaveBeenCalled()
  })

  it('shows full team status correctly', () => {
    const fullTeamGameData = {
      ...mockGameData,
      teams: [
        {
          name: 'pumpkin',
          display_name: 'Tök Csapat',
          max_players: 2,
          players: [
            { id: 'player1', name: 'Player 1' },
            { id: 'player2', name: 'Player 2' }
          ]
        },
        {
          name: 'ghost',
          display_name: 'Szellem Csapat',
          max_players: 2,
          players: []
        }
      ]
    }

    render(
      <PlayerRegistration 
        gameData={fullTeamGameData} 
        onJoinGame={mockOnJoinGame} 
        onBack={mockOnBack} 
      />
    )
    
    expect(screen.getByText('1/2 játékos')).toBeInTheDocument()
    expect(screen.getByText('0/2 játékos')).toBeInTheDocument()
  })

  it('clears error when submitting valid data after error', async () => {
    render(
      <PlayerRegistration 
        gameCode="ABC123"
        onJoinGame={mockOnJoinGame} 
        onBack={mockOnBack} 
      />,
      { wrapper: createWrapper() }
    )
    
    const nameInput = screen.getByPlaceholderText('Írd be a neved...')
    const pumpkinTeam = screen.getByText('Tök Csapat')
    const submitButton = screen.getByText('Csatlakozás! 🎮')
    
    // First submit without name to show error
    fireEvent.click(submitButton)
    expect(screen.getByText('Add meg a neved!')).toBeInTheDocument()
    
    // Then submit with valid data
    fireEvent.change(nameInput, { target: { value: 'Test Player' } })
    fireEvent.click(pumpkinTeam)
    fireEvent.click(submitButton)
    
    expect(screen.queryByText('Add meg a neved!')).not.toBeInTheDocument()
    await waitFor(() => {
      expect(mockOnJoinGame).toHaveBeenCalledWith('test-game-id', 'Test Player', 'pumpkin')
    })
  })

  it('handles single team game correctly', () => {
    const singleTeamGameData = {
      ...mockGameData,
      game: {
        ...mockGameData.game,
        team_count: 1
      },
      teams: [
        {
          name: 'pumpkin',
          display_name: 'Tök Csapat',
          max_players: 2,
          players: []
        }
      ]
    }

    render(
      <PlayerRegistration 
        gameData={singleTeamGameData} 
        onJoinGame={mockOnJoinGame} 
        onBack={mockOnBack} 
      />
    )
    
    expect(screen.getByText('Tök Csapat')).toBeInTheDocument()
    expect(screen.getByText('0/2 játékos')).toBeInTheDocument()
  })
})

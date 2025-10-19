// components/__tests__/AdminPanel.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminPanel from '../AdminPanel';
import { gameAPI } from '../../services/api';

// Mock API
import { vi } from 'vitest';

vi.mock('../../services/api', () => ({
  gameAPI: {
    listGames: vi.fn(),
    createGame: vi.fn(),
    deleteGame: vi.fn(),
    stopGame: vi.fn(),
    startGame: vi.fn(),
    resetGame: vi.fn(),
    addPlayer: vi.fn(),
    removePlayer: vi.fn(),
    movePlayer: vi.fn(),
    updateGame: vi.fn(),
  },
}));

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

describe('AdminPanel - Cache Szinkronizáció', () => {
  const mockGames = [
    { id: 'game1', name: 'Test Game 1', game_code: 'ABC123', created_by: 'Admin1' },
    { id: 'game2', name: 'Test Game 2', game_code: 'DEF456', created_by: 'Admin2' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    gameAPI.listGames.mockResolvedValue(mockGames); // Return games array directly
  });

  test('AdminPanel betölti a játékokat', async () => {
    render(<AdminPanel onBack={vi.fn()} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Test Game 1')).toBeInTheDocument();
      expect(screen.getByText('Test Game 2')).toBeInTheDocument();
    });
  });

  test('Frissítés gomb működik', async () => {
    render(<AdminPanel onBack={vi.fn()} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Test Game 1')).toBeInTheDocument();
    });

    // Frissítés gomb megnyomása
    const refreshButton = screen.getByText('Frissítés');
    fireEvent.click(refreshButton);

    // Ellenőrizzük, hogy a listGames API-t újra meghívták
    await waitFor(() => {
      expect(gameAPI.listGames).toHaveBeenCalledTimes(2); // Első betöltés + frissítés
    });
  });

  test('Játék törlése cache-t frissíti', async () => {
    const mockDeleteResponse = { success: true };
    gameAPI.deleteGame.mockResolvedValue(mockDeleteResponse);
    
    // Mock a törlés utáni frissített listát
    const updatedGames = mockGames.filter(game => game.id !== 'game1');
    gameAPI.listGames
      .mockResolvedValueOnce(mockGames) // Első betöltés
      .mockResolvedValueOnce(updatedGames); // Törlés utáni frissítés

    render(<AdminPanel onBack={vi.fn()} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Test Game 1')).toBeInTheDocument();
    });

    // Játék törlése (mock confirm dialog)
    window.confirm = vi.fn(() => true);
    
    // Törlés gomb megkeresése és megnyomása (🗑️ emoji)
    const deleteButtons = screen.getAllByText('🗑️');
    fireEvent.click(deleteButtons[0]); // Első játék törlése

    await waitFor(() => {
      expect(gameAPI.deleteGame).toHaveBeenCalledWith('game1');
    });

    // Ellenőrizzük, hogy a cache frissült
    await waitFor(() => {
      expect(screen.queryByText('Test Game 1')).not.toBeInTheDocument();
      expect(screen.getByText('Test Game 2')).toBeInTheDocument();
    });
  });

  test('Játék létrehozása cache-t frissíti', async () => {
    const newGame = { id: 'game3', name: 'New Game', game_code: 'GHI789', created_by: 'Admin3' };
    gameAPI.createGame.mockResolvedValue(newGame);
    
    // Mock a létrehozás utáni frissített listát
    const updatedGames = [...mockGames, newGame];
    gameAPI.listGames
      .mockResolvedValueOnce({ games: mockGames }) // Első betöltés
      .mockResolvedValueOnce({ games: updatedGames }); // Létrehozás utáni frissítés

    render(<AdminPanel onBack={vi.fn()} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Test Game 1')).toBeInTheDocument();
    });

    // Új játék gomb megnyomása
    const newGameButton = screen.getByText('Új játék');
    fireEvent.click(newGameButton);

    // Admin név megadása
    const adminNameInput = screen.getByPlaceholderText('Admin neve');
    fireEvent.change(adminNameInput, { target: { value: 'Admin3' } });

    // Játék létrehozása
    const createButton = screen.getByText('Játék létrehozása');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(gameAPI.createGame).toHaveBeenCalledWith(
        'Halloween Kincskereső',
        'Admin3',
        4,
        2
      );
    });

    // Ellenőrizzük, hogy a cache frissült
    await waitFor(() => {
      expect(screen.getByText('New Game')).toBeInTheDocument();
    });
  });

  test('Polling intervallum helyes', () => {
    vi.useFakeTimers();

    render(<AdminPanel onBack={vi.fn()} />, { wrapper: createWrapper() });

    // Első API hívás
    expect(gameAPI.listGames).toHaveBeenCalledTimes(1);

    // 5 másodperc eltelte után (polling interval)
    vi.advanceTimersByTime(5000);

    // Ellenőrizzük, hogy a polling működik
    expect(gameAPI.listGames).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });
});

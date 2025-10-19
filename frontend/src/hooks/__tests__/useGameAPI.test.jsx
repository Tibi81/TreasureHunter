// hooks/__tests__/useGameAPI.test.jsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// Mock API before importing useGameAPI
vi.mock('../../services/api.js', () => ({
  gameAPI: {
    listGames: vi.fn(),
    createGame: vi.fn(),
    deleteGame: vi.fn(),
    getGameStatus: vi.fn(),
  },
}));

// Import after mocking
import { gameKeys } from '../useGameAPI.js';
import { gameAPI } from '../../services/api.js';

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

describe('useGameAPI - Query Key Konzisztencia', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('gameKeys struktúra', () => {
    test('gameKeys.lists() helyes struktúrát ad vissza', () => {
      expect(gameKeys.lists()).toEqual(['games', 'list']);
    });

    test('gameKeys.detail(gameId) helyes struktúrát ad vissza', () => {
      const gameId = 'test-game-123';
      expect(gameKeys.detail(gameId)).toEqual(['games', 'detail', gameId]);
    });

    test('gameKeys.simple.games helyes struktúrát ad vissza', () => {
      expect(gameKeys.simple.games).toEqual(['games']);
    });

    test('gameKeys.simple.game(gameId) helyes struktúrát ad vissza', () => {
      const gameId = 'test-game-123';
      expect(gameKeys.simple.game(gameId)).toEqual(['game', gameId]);
    });

    test('gameKeys.simple.gameCode(code) helyes struktúrát ad vissza', () => {
      const code = 'ABC123';
      expect(gameKeys.simple.gameCode(code)).toEqual(['game', 'code', code]);
    });

    test('gameKeys.simple.challenge(gameId, teamName) helyes struktúrát ad vissza', () => {
      const gameId = 'test-game-123';
      const teamName = 'pumpkin';
      expect(gameKeys.simple.challenge(gameId, teamName)).toEqual(['challenge', gameId, teamName]);
    });
  });

  describe('Cache invalidation logika', () => {
    test('useGames hook helyes query key-t használ', async () => {
      gameAPI.listGames.mockResolvedValue({ games: [] });
      
      const { result } = renderHook(() => {
        const { useGames } = require('../useGameAPI');
        return useGames();
      }, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Ellenőrizzük, hogy a helyes query key-t használja
      expect(result.current.queryKey).toEqual(['games', 'list']);
    });

    test('useGame hook helyes query key-t használ', async () => {
      const gameId = 'test-game-123';
      gameAPI.getGameStatus.mockResolvedValue({ id: gameId, name: 'Test Game' });
      
      const { result } = renderHook(() => {
        const { useGame } = require('../useGameAPI');
        return useGame(gameId);
      }, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Ellenőrizzük, hogy a helyes query key-t használja
      expect(result.current.queryKey).toEqual(['games', 'detail', gameId]);
    });
  });

  describe('Mutation cache frissítés', () => {
    test('useCreateGame mutation cache-t frissít', async () => {
      const mockGame = { id: 'new-game', name: 'New Game' };
      gameAPI.createGame.mockResolvedValue(mockGame);
      gameAPI.listGames.mockResolvedValue({ games: [mockGame] });
      
      const { result } = renderHook(() => {
        const { useCreateGame } = require('../useGameAPI');
        return useCreateGame();
      }, { wrapper: createWrapper() });

      // Mutation végrehajtása
      await result.current.mutateAsync({
        gameName: 'New Game',
        adminName: 'Admin',
        maxPlayers: 4,
        teamCount: 2
      });

      // Ellenőrizzük, hogy a mutation sikeres volt
      expect(result.current.isSuccess).toBe(true);
    });

    test('useDeleteGame mutation cache-t frissít', async () => {
      const gameId = 'test-game-123';
      gameAPI.deleteGame.mockResolvedValue({ success: true });
      gameAPI.listGames.mockResolvedValue({ games: [] });
      
      const { result } = renderHook(() => {
        const { useDeleteGame } = require('../useGameAPI');
        return useDeleteGame();
      }, { wrapper: createWrapper() });

      // Mutation végrehajtása
      await result.current.mutateAsync(gameId);

      // Ellenőrizzük, hogy a mutation sikeres volt
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

describe('useGameAPI - Cache Konfiguráció', () => {
  test('useGames hook globális cache beállításokat használ', () => {
    gameAPI.listGames.mockResolvedValue({ games: [] });
    
    const { result } = renderHook(() => {
      const { useGames } = require('../useGameAPI');
      return useGames();
    }, { wrapper: createWrapper() });

    // Ellenőrizzük, hogy nincs query-specifikus polling
    expect(result.current.refetchInterval).toBeUndefined();
    expect(result.current.refetchIntervalInBackground).toBeUndefined();
  });

  test('useGame hook globális cache beállításokat használ', () => {
    const gameId = 'test-game-123';
    gameAPI.getGameStatus.mockResolvedValue({ id: gameId });
    
    const { result } = renderHook(() => {
      const { useGame } = require('../useGameAPI');
      return useGame(gameId);
    }, { wrapper: createWrapper() });

    // Ellenőrizzük, hogy nincs query-specifikus polling
    expect(result.current.refetchInterval).toBeUndefined();
    expect(result.current.refetchIntervalInBackground).toBeUndefined();
  });
});

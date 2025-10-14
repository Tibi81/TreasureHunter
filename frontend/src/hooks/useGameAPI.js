// hooks/useGameAPI.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gameAPI } from '../services/api';

// Query keys
export const gameKeys = {
  all: ['games'],
  lists: () => [...gameKeys.all, 'list'],
  list: (filters) => [...gameKeys.lists(), { filters }],
  details: () => [...gameKeys.all, 'detail'],
  detail: (id) => [...gameKeys.details(), id],
  status: (id) => [...gameKeys.detail(id), 'status'],
};

// Játékok listázása
export const useGames = () => {
  return useQuery({
    queryKey: gameKeys.lists(),
    queryFn: async () => {
      try {
        const response = await gameAPI.listGames();
        return response?.games || [];
      } catch (error) {
        console.error('useGames error:', error);
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 másodperc
    refetchInterval: 10 * 1000, // 10 másodperc
  });
};

// Játék részletei
export const useGame = (gameId) => {
  return useQuery({
    queryKey: gameKeys.detail(gameId),
    queryFn: () => gameAPI.getGameStatus(gameId),
    enabled: !!gameId,
    staleTime: 5 * 1000, // 5 másodperc
    refetchInterval: 3 * 1000, // 3 másodperc
  });
};

// Játék keresése kód alapján
export const useFindGameByCode = (gameCode) => {
  return useQuery({
    queryKey: ['game', 'code', gameCode],
    queryFn: () => gameAPI.findGameByCode(gameCode),
    enabled: !!gameCode && gameCode.length >= 3,
    staleTime: 60 * 1000, // 1 perc
  });
};

// Játék létrehozása
export const useCreateGame = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ gameName, adminName, maxPlayers, teamCount }) =>
      gameAPI.createGame(gameName, adminName, maxPlayers, teamCount),
    onSuccess: () => {
      // Frissítsük a játékok listáját
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
    },
  });
};

// Játék szerkesztése
export const useUpdateGame = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ gameId, gameData }) => gameAPI.updateGame(gameId, gameData),
    onSuccess: (data, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameId) });
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
    },
  });
};

// Játék indítása
export const useStartGame = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (gameId) => gameAPI.startGame(gameId),
    onSuccess: (data, gameId) => {
      // Frissítsük a játék állapotát
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameId) });
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
    },
  });
};

// Játék leállítása
export const useStopGame = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (gameId) => gameAPI.stopGame(gameId),
    onSuccess: (data, gameId) => {
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameId) });
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
    },
  });
};

// Játék törlése
export const useDeleteGame = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (gameId) => gameAPI.deleteGame(gameId),
    onSuccess: (data, gameId) => {
      // Távolítsuk el a cache-ből
      queryClient.removeQueries({ queryKey: gameKeys.detail(gameId) });
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
    },
    onError: (error, gameId) => {
      console.error('Delete game error:', error);
      // Ha 404 hiba, akkor a játék már nem létezik, frissítsük a listát
      if (error.status === 404) {
        queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
      }
    },
  });
};

// Játék visszaállítása
export const useResetGame = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (gameId) => gameAPI.resetGame(gameId),
    onSuccess: (data, gameId) => {
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameId) });
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
    },
  });
};

// Játékos hozzáadása
export const useAddPlayer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ gameId, playerName, teamName }) =>
      gameAPI.addPlayer(gameId, playerName, teamName),
    onSuccess: (data, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameId) });
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
    },
  });
};

// Játékos eltávolítása
export const useRemovePlayer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ gameId, playerId }) =>
      gameAPI.removePlayer(gameId, playerId),
    onSuccess: (data, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameId) });
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
    },
  });
};

// Játékos áthelyezése
export const useMovePlayer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ gameId, playerId, newTeam }) =>
      gameAPI.movePlayer(gameId, playerId, newTeam),
    onSuccess: (data, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameId) });
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
    },
  });
};

// Játékos csatlakozása
export const useJoinGame = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ gameId, playerName, teamName }) =>
      gameAPI.joinGame(gameId, playerName, teamName),
    onSuccess: (data, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameId) });
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
    },
  });
};

// QR kód validálása
export const useValidateQR = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ gameId, teamName, qrCode }) =>
      gameAPI.validateQR(gameId, teamName, qrCode),
    onSuccess: (data, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameId) });
    },
  });
};

// Segítség kérése
export const useGetHelp = () => {
  return useMutation({
    mutationFn: ({ gameId, teamName }) =>
      gameAPI.getHelp(gameId, teamName),
  });
};

// Játékos kilépése
export const useExitGame = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => gameAPI.exitGame(),
    onSuccess: () => {
      // Töröljük az összes cache-t
      queryClient.clear();
    },
  });
};

// Session visszaállítása
export const useRestoreSession = () => {
  return useQuery({
    queryKey: ['session', 'restore'],
    queryFn: () => gameAPI.restoreSession(),
    enabled: false, // Csak manuálisan hívjuk meg
    staleTime: 0,
  });
};

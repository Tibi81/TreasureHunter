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

// Játékok listázása - AZONNALI frissítés
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
    staleTime: 500, // 0.5 másodperc - AZONNALI frissítés
    refetchInterval: 1000, // 1 másodperc - AZONNALI frissítés
    refetchIntervalInBackground: true, // ✅ Háttérben is frissít
    refetchOnMount: 'always', // ✅ Mindig friss adat
    refetchOnWindowFocus: true, // ✅ Ablak fókuszban frissít
  });
};

// Játék részletei - AZONNALI frissítés
export const useGame = (gameId) => {
  return useQuery({
    queryKey: gameKeys.detail(gameId),
    queryFn: () => gameAPI.getGameStatus(gameId),
    enabled: !!gameId,
    staleTime: 500, // 0.5 másodperc - AZONNALI frissítés
    refetchInterval: 1000, // 1 másodperc - AZONNALI frissítés
    refetchIntervalInBackground: true, // ✅ Háttérben is frissít
    refetchOnMount: 'always', // ✅ Mindig friss adat
    refetchOnWindowFocus: true, // ✅ Ablak fókuszban frissít
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

// Játék keresése kód alapján - optimalizált verzió
export const useFindGameByCodeOptimized = (gameCode, options = {}) => {
  return useQuery({
    queryKey: ['game', 'code', gameCode],
    queryFn: () => gameAPI.findGameByCode(gameCode),
    enabled: !!gameCode && gameCode.length >= 3 && (options.enabled !== false),
    staleTime: 60 * 1000, // 1 perc
    ...options,
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
    onMutate: async (gameId) => {
      // ✅ Optimista update - azonnali UI feedback
      await queryClient.cancelQueries({ queryKey: gameKeys.lists() });
      
      const previousGames = queryClient.getQueryData(gameKeys.lists());
      
      // Optimista frissítés - eltávolítjuk a játékot
      queryClient.setQueryData(gameKeys.lists(), (old) => {
        if (!old) return old;
        return old.filter(game => game.id !== gameId);
      });
      
      return { previousGames };
    },
    onError: (error, gameId, context) => {
      console.error('Delete game error:', error);
      
      // Ha 404 hiba, akkor a játék már nem létezik, ne csináljunk rollback-et
      if (error.status === 404) {
        // Eltávolítjuk az összes kapcsolódó query-t
        queryClient.removeQueries({ queryKey: gameKeys.detail(gameId) });
        queryClient.removeQueries({ queryKey: ['challenge', gameId] });
        // Azonnal frissítjük a listát
        queryClient.refetchQueries({ queryKey: gameKeys.lists() });
      } else {
        // ✅ Rollback csak nem-404 hibák esetén
        if (context?.previousGames) {
          queryClient.setQueryData(gameKeys.lists(), context.previousGames);
        }
      }
    },
    onSuccess: (data, gameId) => {
      // ✅ AZONNALI frissítés esemény után
      queryClient.removeQueries({ queryKey: gameKeys.detail(gameId) });
      queryClient.removeQueries({ queryKey: ['challenge', gameId] });
      // AZONNALI refetch - nem csak invalidate
      queryClient.refetchQueries({ queryKey: gameKeys.lists() });
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
    onMutate: async ({ gameId, playerName, teamName }) => {
      // ✅ Optimista update - azonnali UI feedback
      await queryClient.cancelQueries({ queryKey: gameKeys.lists() });
      await queryClient.cancelQueries({ queryKey: gameKeys.detail(gameId) });
      
      const previousGames = queryClient.getQueryData(gameKeys.lists());
      const previousGame = queryClient.getQueryData(gameKeys.detail(gameId));
      
      // Optimista frissítés
      queryClient.setQueryData(gameKeys.lists(), (old) => {
        if (!old) return old;
        return old.map(game => {
          if (game.id === gameId) {
            const newPlayer = {
              id: `temp-${Date.now()}`, // Ideiglenes ID
              name: playerName,
              team: teamName,
              is_active: true
            };
            return {
              ...game,
              players: [...(game.players || []), newPlayer]
            };
          }
          return game;
        });
      });
      
      return { previousGames, previousGame };
    },
    onError: (err, variables, context) => {
      // ✅ Rollback ha hiba van
      if (context?.previousGames) {
        queryClient.setQueryData(gameKeys.lists(), context.previousGames);
      }
      if (context?.previousGame) {
        queryClient.setQueryData(gameKeys.detail(variables.gameId), context.previousGame);
      }
    },
    onSuccess: (data, { gameId }) => {
      // ✅ AZONNALI frissítés esemény után
      queryClient.refetchQueries({ queryKey: gameKeys.detail(gameId) });
      queryClient.refetchQueries({ queryKey: gameKeys.lists() });
      queryClient.refetchQueries({ queryKey: ['challenge', gameId] });
    },
  });
};

// Játékos eltávolítása
export const useRemovePlayer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ gameId, playerId }) =>
      gameAPI.removePlayer(gameId, playerId),
    onMutate: async ({ gameId, playerId }) => {
      // ✅ Optimista update - azonnali UI feedback
      await queryClient.cancelQueries({ queryKey: gameKeys.lists() });
      
      const previousGames = queryClient.getQueryData(gameKeys.lists());
      
      // Optimista frissítés
      queryClient.setQueryData(gameKeys.lists(), (old) => {
        if (!old) return old;
        return old.map(game => {
          if (game.id === gameId) {
            return {
              ...game,
              players: (game.players || []).filter(p => p.id !== playerId)
            };
          }
          return game;
        });
      });
      
      return { previousGames };
    },
    onError: (err, variables, context) => {
      // ✅ Rollback ha hiba van
      if (context?.previousGames) {
        queryClient.setQueryData(gameKeys.lists(), context.previousGames);
      }
    },
    onSuccess: (data, { gameId }) => {
      // ✅ AZONNALI frissítés esemény után
      queryClient.refetchQueries({ queryKey: gameKeys.detail(gameId) });
      queryClient.refetchQueries({ queryKey: gameKeys.lists() });
      queryClient.refetchQueries({ queryKey: ['challenge', gameId] });
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
    mutationFn: async ({ gameId, playerName, teamName }) => {
      try {
        return await gameAPI.joinGame(gameId, playerName, teamName);
      } catch (error) {
        // Részletesebb hibaüzenet a backend validáció alapján
        if (error.status === 400) {
          // Próbáljuk meg kinyerni a pontos hibaüzenetet
          const errorMessage = error.message || 'Nem lehet csatlakozni a játékhoz';
          throw new Error(errorMessage);
        }
        throw error;
      }
    },
    onMutate: async ({ gameId, playerName, teamName }) => {
      // ✅ Optimista update - azonnali UI feedback
      await queryClient.cancelQueries({ queryKey: gameKeys.detail(gameId) });
      await queryClient.cancelQueries({ queryKey: gameKeys.lists() });
      
      const previousGame = queryClient.getQueryData(gameKeys.detail(gameId));
      const previousGames = queryClient.getQueryData(gameKeys.lists());
      
      // Optimista frissítés - hozzáadjuk a játékost
      if (previousGame) {
        queryClient.setQueryData(gameKeys.detail(gameId), (old) => {
          if (!old) return old;
          const newPlayer = {
            id: `temp-${Date.now()}`,
            name: playerName,
            team: teamName,
            is_active: true
          };
          return {
            ...old,
            players: [...(old.players || []), newPlayer]
          };
        });
      }
      
      return { previousGame, previousGames };
    },
    onError: (err, variables, context) => {
      // ✅ Rollback ha hiba van
      if (context?.previousGame) {
        queryClient.setQueryData(gameKeys.detail(variables.gameId), context.previousGame);
      }
      if (context?.previousGames) {
        queryClient.setQueryData(gameKeys.lists(), context.previousGames);
      }
    },
    onSuccess: (data, { gameId }) => {
      // ✅ Azonnali frissítés esemény után
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
      // ✅ Azonnali frissítés QR validálás után
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameId) });
      queryClient.invalidateQueries({ queryKey: ['challenge', gameId] });
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

// Aktuális feladat lekérése - AZONNALI frissítés
export const useCurrentChallenge = (gameId, teamName, options = {}) => {
  return useQuery({
    queryKey: ['challenge', gameId, teamName],
    queryFn: async () => {
      try {
        return await gameAPI.getCurrentChallenge(gameId, teamName);
      } catch (error) {
        // Ha 400-as hiba (Bad Request), akkor valószínűleg nincs aktív feladat
        if (error.status === 400) {
          return null; // Visszaadjuk null-t, nem dobunk hibát
        }
        throw error; // Egyéb hibákat továbbdobjuk
      }
    },
    enabled: !!gameId && !!teamName && (options.enabled !== false),
    staleTime: 500, // 0.5 másodperc - AZONNALI frissítés
    refetchInterval: 1000, // 1 másodperc - AZONNALI frissítés
    refetchIntervalInBackground: true, // ✅ Háttérben is frissít
    refetchOnMount: 'always', // ✅ Mindig friss adat
    refetchOnWindowFocus: true, // ✅ Ablak fókuszban frissít
    retry: (failureCount, error) => {
      // Ha 400-as hiba, ne próbálkozzunk újra
      if (error?.status === 400) {
        return false;
      }
      // Egyéb hibák esetén próbálkozzunk maximum 2-szer
      return failureCount < 2;
    },
    ...options, // Egyéb opciók felülírása
  });
};
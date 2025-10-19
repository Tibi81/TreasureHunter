// hooks/useGameAPI.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gameAPI } from '../services/api.js';

// Query keys - TELJES STRUKTÚRA
export const gameKeys = {
  all: ['games'],
  lists: () => [...gameKeys.all, 'list'],
  detail: (id) => [...gameKeys.all, 'detail', id],
  status: (id) => [...gameKeys.detail(id), 'status'],
  gameCode: (code) => [...gameKeys.all, 'code', code],
  challenge: (gameId, teamName) => ['challenge', gameId, teamName],
  simple: {
    games: ['games'],
    game: (id) => ['game', id],
    gameCode: (code) => ['game', 'code', code],
    challenge: (gameId, teamName) => ['challenge', gameId, teamName],
  }
};

// Játékok listázása - STABIL konfiguráció
export const useGames = () => {
  return useQuery({
    queryKey: gameKeys.lists(),
    queryFn: async () => {
      try {
        console.log('🔍 useGames - API call started');
        const response = await gameAPI.listGames();
        console.log('🔍 useGames - API response:', response);
        const games = response?.games || [];
        console.log('🔍 useGames - returning games:', games);
        return games;
      } catch (error) {
        console.error('🔍 useGames - API error:', error);
        throw error;
      }
    },
    staleTime: 30 * 1000,  // ✅ 30 másodperc - NE töltse újra folyamatosan!
    gcTime: 5 * 60 * 1000,  // 5 perc cache
    refetchOnMount: false,  // ✅ NE töltse újra mount-kor automatikusan
    refetchOnWindowFocus: false,  // ✅ NE töltse újra fókusznál
    refetchOnReconnect: false,  // ✅ NE töltse újra újracsatlakozáskor
  });
};

// Játék részletei - OPTIMALIZÁLT konfiguráció
export const useGame = (gameId) => {
  return useQuery({
    queryKey: gameKeys.detail(gameId),
    queryFn: () => gameAPI.getGameStatus(gameId),
    enabled: !!gameId,
    staleTime: 30 * 1000, // ✅ 30 másodperc - stabil cache
    gcTime: 5 * 60 * 1000, // 5 perc cache
    refetchOnMount: false, // ✅ NE töltse újra mount-kor
    refetchOnWindowFocus: false, // ✅ NE töltse újra fókusznál
    refetchOnReconnect: false, // ✅ NE töltse újra újracsatlakozáskor
  });
};

// Játék keresése kód alapján
export const useFindGameByCode = (gameCode) => {
  return useQuery({
    queryKey: gameKeys.gameCode(gameCode),
    queryFn: () => gameAPI.findGameByCode(gameCode),
    enabled: !!gameCode && gameCode.length >= 3,
    staleTime: 60 * 1000, // 1 perc
  });
};

// Játék keresése kód alapján - optimalizált verzió - EGYSZERŰSÍTETT
export const useFindGameByCodeOptimized = (gameCode, options = {}) => {
  return useQuery({
    queryKey: gameKeys.gameCode(gameCode),
    queryFn: () => gameAPI.findGameByCode(gameCode),
    enabled: !!gameCode && gameCode.length >= 3 && (options.enabled !== false),
    staleTime: 500, // 0.5 másodperc - csak ez marad
    // ✅ Nincs polling - csak manuális frissítés
    ...options,
  });
};

// Játék létrehozása - FORCE REFETCH MUTATION
export const useCreateGame = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ gameName, adminName, maxPlayers, teamCount }) => {
      console.log('🚀 CREATE GAME MUTATION STARTED:', { gameName, adminName, maxPlayers, teamCount });
      return gameAPI.createGame(gameName, adminName, maxPlayers, teamCount);
    },
    onMutate: async ({ gameName, adminName, maxPlayers, teamCount }) => {
      console.log('🔄 CREATE GAME onMutate STARTED');
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: gameKeys.lists() });
      
      const previousGames = queryClient.getQueryData(gameKeys.lists());
      
      // Optimistic update - TELJES STRUKTÚRA
      const tempGame = {
        id: `temp-${Date.now()}`,
        name: gameName,
        game_code: `TEMP-${Date.now().toString(36).toUpperCase()}`, // Temp kód
        created_by: adminName,
        max_players: maxPlayers,
        team_count: teamCount,
        status: 'waiting',
        total_players: 0, // Kezdetben 0 játékos
        created_at: new Date().toISOString(), // Jelenlegi idő
        players: []
      };
      
      queryClient.setQueryData(gameKeys.lists(), (old) => {
        if (!old) return [tempGame];
        return [tempGame, ...old];
      });
      
      console.log('✅ CREATE GAME onMutate COMPLETED - temp game added');
      return { previousGames, tempId: tempGame.id };
    },
    onError: (error, variables, context) => {
      console.log('❌ CREATE GAME onError:', error);
      
      // Rollback
      if (context?.previousGames) {
        queryClient.setQueryData(gameKeys.lists(), context.previousGames);
      }
    },
    onSuccess: (data, variables, context) => {
      console.log('🎉 CREATE GAME onSuccess STARTED:', data);
      
      // ✅ Cseréljük le a temp game-et a valósra
      queryClient.setQueryData(gameKeys.lists(), (old) => {
        if (!old) return [data.game]; // API válasz: { game: {...}, teams: [...], ... }
        return old.map(game => 
          game && game.id === context.tempId ? data.game : game
        );
      });
      
      // ✅ JAVÍTOTT: NINCS invalidate - csak optimista frissítés
      // A setQueryData már frissíti a cache-t, az invalidate felesleges
      
      console.log('✅ CREATE GAME onSuccess COMPLETED');
      
      // ✅ VISSZAADJUK A DATA-T, HOGY A COMPONENT HASZNÁLHASSA
      return data;
    },
  });
};

// Játék szerkesztése
export const useUpdateGame = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ gameId, gameData }) => gameAPI.updateGame(gameId, gameData),
    onSuccess: (data, { gameId }) => {
      console.log('🔄 Game updated, invalidating caches...');
      
      queryClient.invalidateQueries({ 
        queryKey: gameKeys.detail(gameId),
        refetchType: 'none'
      });
      
      queryClient.invalidateQueries({ 
        queryKey: gameKeys.lists(),
        refetchType: 'none'
      });
      
      console.log('✅ Game update cache invalidation completed');
    },
  });
};

// Játék indítása
export const useStartGame = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (gameId) => gameAPI.startGame(gameId),
    onSuccess: (data, gameId) => {
      console.log('🚀 Game started, updating caches optimistically...');
      
      // ✅ OPTIMISTA FRISSÍTÉS - azonnali UI feedback
      queryClient.setQueryData(gameKeys.detail(gameId), (old) => {
        if (!old) return old;
        return {
          ...old,
          status: 'separate' // Játék indítása után separate állapot
        };
      });
      
      // ✅ JAVÍTOTT: useGames() hook cache frissítése (tömb struktúra)
      queryClient.setQueryData(gameKeys.lists(), (old) => {
        if (!old) return old;
        return old.map(game => {
          if (game.id === gameId) {
            return {
              ...game,
              status: 'separate'
            };
          }
          return game;
        });
      });
      
      console.log('✅ Game start optimistic update completed');
    },
  });
};

// Játék leállítása
export const useStopGame = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (gameId) => gameAPI.stopGame(gameId),
    onError: (error, gameId) => {
      console.error('Stop game error:', error);
      
      // Ha 404 hiba, akkor a játék már nem létezik
      if (error.status === 404) {
        // Eltávolítjuk az összes kapcsolódó query-t
        queryClient.removeQueries({ queryKey: gameKeys.detail(gameId) });
        queryClient.removeQueries({ queryKey: ['challenge', gameId] });
        // Azonnal frissítjük a listát
        queryClient.refetchQueries({ queryKey: gameKeys.lists() });
      }
    },
    onSuccess: (data, gameId) => {
      queryClient.refetchQueries({ queryKey: gameKeys.detail(gameId) });
      queryClient.refetchQueries({ queryKey: gameKeys.lists() });
    },
  });
};

// Játék törlése - FORCE REFETCH MUTATION
export const useDeleteGame = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (gameId) => {
      console.log('🗑️ DELETE GAME MUTATION STARTED:', gameId);
      return gameAPI.deleteGame(gameId);
    },
    onMutate: async (gameId) => {
      console.log('🔄 DELETE GAME onMutate STARTED');
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: gameKeys.lists() });
      
      const previousGames = queryClient.getQueryData(gameKeys.lists());
      
      // Optimistic update
      queryClient.setQueryData(gameKeys.lists(), (old) => {
        if (!old) return old;
        console.log('🗑️ Removing game from cache:', gameId);
        return old.filter(game => game && game.id !== gameId);
      });
      
      console.log('✅ DELETE GAME onMutate COMPLETED - game removed from cache');
      return { previousGames, deletedGameId: gameId };
    },
    onError: (error, gameId, context) => {
      console.log('❌ DELETE GAME onError:', error);
      
      // Rollback
      if (context?.previousGames) {
        queryClient.setQueryData(gameKeys.lists(), context.previousGames);
      }
      
      // Ha 404 hiba, akkor a játék már nem létezik
      if (error.status === 404) {
        queryClient.removeQueries({ queryKey: gameKeys.detail(gameId) });
      }
    },
    onSuccess: (data, gameId) => {
      console.log('🎉 DELETE GAME onSuccess STARTED:', data);
      
      // ✅ OPTIMISTA FRISSÍTÉS - azonnali UI feedback
      // Cache tisztítás
      queryClient.removeQueries({ queryKey: gameKeys.detail(gameId) });
      queryClient.removeQueries({ queryKey: gameKeys.challenge(gameId, '*') });
      
      // ✅ JAVÍTOTT: useGames() hook cache frissítése (tömb struktúra)
      queryClient.setQueryData(gameKeys.lists(), (old) => {
        if (!old) return old;
        console.log('🗑️ Removing game from games list cache:', gameId);
        return old.filter(game => game && game.id !== gameId);
      });
      
      console.log('✅ DELETE GAME onSuccess COMPLETED');
    },
  });
};

// Játék visszaállítása
export const useResetGame = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (gameId) => gameAPI.resetGame(gameId),
    onSuccess: (data, gameId) => {
      queryClient.refetchQueries({ queryKey: gameKeys.detail(gameId) });
      queryClient.refetchQueries({ queryKey: gameKeys.lists() });
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
      queryClient.refetchQueries({ queryKey: gameKeys.detail(gameId) });
      queryClient.refetchQueries({ queryKey: gameKeys.lists() });
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
    onSuccess: (data, { gameId, playerName, teamName }) => {
      console.log('🎮 Player joined successfully, updating caches optimistically...');
      console.log('🎮 onSuccess data:', data);
      console.log('🎮 onSuccess gameId:', gameId);
      console.log('🎮 onSuccess playerName:', playerName);
      console.log('🎮 onSuccess teamName:', teamName);
      
      // ✅ OPTIMISTA FRISSÍTÉS - azonnali UI feedback
      queryClient.setQueryData(gameKeys.detail(gameId), (old) => {
        console.log('🎮 Updating gameKeys.detail cache, old data:', old);
        if (!old) return old;
        const newPlayer = {
          id: data.player_id || `player-${Date.now()}`,
          name: playerName,
          team: teamName,
          is_active: true
        };
        console.log('🎮 Adding new player to detail cache:', newPlayer);
        return {
          ...old,
          players: [...(old.players || []), newPlayer]
        };
      });
      
      // ✅ JAVÍTOTT: useGames() hook cache frissítése (tömb struktúra)
      queryClient.setQueryData(gameKeys.lists(), (old) => {
        console.log('🎮 Updating gameKeys.lists cache, old data:', old);
        if (!old) return old;
        const updatedGames = old.map(game => {
          if (game.id === gameId) {
            // ✅ JAVÍTOTT: Teljes játékos lista frissítése
            const newPlayer = {
              id: data.player_id || `player-${Date.now()}`,
              name: playerName,
              team: teamName,
              is_active: true
            };
            console.log('🎮 Adding new player to lists cache:', newPlayer);
            
            const updatedGame = {
              ...game,
              total_players: (game.total_players || 0) + 1,
              // ✅ JAVÍTOTT: Játékosok listája frissítése
              players: [...(game.players || []), newPlayer],
              // ✅ JAVÍTOTT: Csapatok frissítése is
              teams: game.teams?.map(team => {
                if (team.name === teamName) {
                  return {
                    ...team,
                    players: [...(team.players || []), newPlayer],
                    player_count: (team.player_count || 0) + 1
                  };
                }
                return team;
              })
            };
            console.log('🎮 Updated game in lists cache:', updatedGame);
            return updatedGame;
          }
          return game;
        });
        console.log('🎮 Final updated games list:', updatedGames);
        return updatedGames;
      });
      
      console.log('✅ Player join optimistic update completed');
    },
  });
};

// QR kód validálása - OPTIMALIZÁLT cache invalidation
export const useValidateQR = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ gameId, teamName, qrCode }) =>
      gameAPI.validateQR(gameId, teamName, qrCode),
    onSuccess: (data, { gameId, teamName }) => {
      console.log('🎯 QR validation successful, updating caches optimistically...');
      
      // ✅ OPTIMISTA FRISSÍTÉS - azonnali UI feedback
      // Challenge cache törlése - új feladat betöltődik
      queryClient.removeQueries({ queryKey: gameKeys.challenge(gameId, teamName) });
      
      // ✅ JAVÍTOTT: Játék állapot frissítése - csapat továbbléptetése
      queryClient.setQueryData(gameKeys.detail(gameId), (old) => {
        if (!old) return old;
        return {
          ...old,
          teams: old.teams?.map(team => {
            if (team.name === teamName) {
              return {
                ...team,
                current_station: (team.current_station || 0) + 1,
                // Ha az utolsó állomás, akkor completed_at beállítása
                completed_at: (team.current_station || 0) >= 5 ? new Date().toISOString() : team.completed_at
              };
            }
            return team;
          })
        };
      });
      
      // ✅ JAVÍTOTT: useGames() hook cache frissítése (tömb struktúra)
      queryClient.setQueryData(gameKeys.lists(), (old) => {
        if (!old) return old;
        return old.map(game => {
          if (game.id === gameId) {
            return {
              ...game,
              teams: game.teams?.map(team => {
                if (team.name === teamName) {
                  return {
                    ...team,
                    current_station: (team.current_station || 0) + 1,
                    completed_at: (team.current_station || 0) >= 5 ? new Date().toISOString() : team.completed_at
                  };
                }
                return team;
              })
            };
          }
          return game;
        });
      });
      
      console.log('✅ QR validation optimistic update completed');
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

// Aktuális feladat lekérése - OPTIMALIZÁLT konfiguráció
export const useCurrentChallenge = (gameId, teamName, options = {}) => {
  return useQuery({
    queryKey: gameKeys.challenge(gameId, teamName),
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
    staleTime: 30 * 1000, // ✅ 30 másodperc - stabil cache
    gcTime: 5 * 60 * 1000, // 5 perc cache
    refetchOnMount: false, // ✅ NE töltse újra mount-kor
    refetchOnWindowFocus: false, // ✅ NE töltse újra fókusznál
    refetchOnReconnect: false, // ✅ NE töltse újra újracsatlakozáskor
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
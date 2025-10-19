// hooks/useSSE.js
import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getApiBaseUrl } from '../config/api';

/**
 * Server-Sent Events hook valós idejű frissítésekhez
 */
export const useSSE = (url, options = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const eventSourceRef = useRef(null);
  const reconnectAttemptsRef = useRef(0); // ✅ ref helyett state
  const reconnectTimeoutRef = useRef(null); // ✅ timeout referencia
  const queryClient = useQueryClient();
  
  const {
    onMessage = () => {},
    onError = () => {},
    onOpen = () => {},
    onClose = () => {},
    enabled = true,
    queryKeys = [],
    maxReconnectAttempts = 5,
  } = options;

  const connect = useCallback(() => {
    if (!enabled || !url) return;
    
    // Töröljük a függőben lévő újracsatlakozást
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    try {
      // Megszakítjuk a korábbi kapcsolatot
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      console.log('🔌 SSE kapcsolat létrehozása:', url);
      
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = (event) => {
        console.log('✅ SSE kapcsolat létrejött:', url);
        console.log('✅ SSE readyState:', eventSource.readyState);
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0; // ✅ Reset
        onOpen(event);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 SSE üzenet érkezett:', data);
          
          // React Query cache frissítése
          if (queryKeys.length > 0) {
            queryKeys.forEach(queryKey => {
              if (data.type === 'game_update' && data.data) {
                queryClient.setQueryData(queryKey, data.data);
              }
            });
          }
          
          onMessage(data, event, connect); // ✅ Connect függvény átadása
        } catch (err) {
          console.error('❌ SSE üzenet feldolgozási hiba:', err);
        }
      };

      eventSource.onerror = (event) => {
        console.error('❌ SSE kapcsolat hiba:', event);
        console.error('❌ SSE readyState:', eventSource.readyState);
        console.error('❌ SSE URL:', url);
        console.error('❌ Event details:', {
          type: event.type,
          target: event.target,
          readyState: event.target?.readyState
        });
        setIsConnected(false);
        
        // ✅ Bezárjuk a hibás kapcsolatot
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        
        onError(event);
        
        // ✅ Intelligens újracsatlakozás ref-fel
        const currentAttempts = reconnectAttemptsRef.current;
        
        if (currentAttempts < maxReconnectAttempts) {
          const delay = Math.min(2000 * Math.pow(2, currentAttempts), 10000); // Gyorsabb újracsatlakozás
          console.log(`🔄 SSE újracsatlakozás ${currentAttempts + 1}/${maxReconnectAttempts} (${delay}ms késéssel)...`);
          
          reconnectAttemptsRef.current += 1;
          setError(`Újracsatlakozás... (${currentAttempts + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.error('❌ SSE újracsatlakozás sikertelen - maximum kísérletek száma elérve');
          setError('SSE kapcsolat nem állítható helyre');
        }
      };

      // ✅ Custom event listener a clean close-hoz
      eventSource.addEventListener('close', () => {
        console.log('🔌 SSE kapcsolat bezárva');
        setIsConnected(false);
        onClose();
      });

    } catch (err) {
      console.error('❌ SSE kapcsolat létrehozási hiba:', err);
      setError(err.message);
    }
  }, [url, enabled, onMessage, onError, onOpen, onClose, queryClient, queryKeys, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    // ✅ Debug: honnan hívódik meg?
    console.log('🔌 SSE kapcsolat megszakítása');
    console.trace('📍 disconnect() hívási stack:'); // ⚠️ FONTOS: mutatja honnan hívódott
    
    // ✅ Töröljük a függőben lévő újracsatlakozást
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
    
    // ✅ Reset számlálók
    reconnectAttemptsRef.current = 0;
  }, []);

  // ✅ Csak enabled és url változásakor csatlakozunk
  useEffect(() => {
    if (enabled && url) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, url]); // ❌ NE legyen benne connect és disconnect!

  return {
    isConnected,
    error,
    reconnectAttempts: reconnectAttemptsRef.current,
    connect,
    disconnect,
  };
};

/**
 * Játék-specifikus SSE hook
 */
export const useGameSSE = (gameId, options = {}) => {
  const baseUrl = getApiBaseUrl();
  const sseUrl = gameId ? `${baseUrl}/api/sse/game/${gameId}/` : null;
  
  const queryClient = useQueryClient();
  
  const handleMessage = useCallback((data, event, connect) => {
    console.log('🎮 Játék SSE üzenet:', data);
    
    switch (data.type) {
      case 'game_update':
        if (data.data) {
          queryClient.setQueryData(['game', gameId], data.data);
          queryClient.setQueryData(['games'], (old) => {
            if (!old) return old;
            return old.map(game => 
              game.id === gameId ? data.data : game
            );
          });
        }
        break;
        
      case 'game_event':
        if (data.event) {
          const eventType = data.event.type;
          console.log(`🎯 Játék esemény: ${eventType}`, data.event);
          
          switch (eventType) {
            case 'player_joined':
            case 'player_left':
            case 'player_updated':
              queryClient.invalidateQueries({ queryKey: ['game', gameId] });
              queryClient.invalidateQueries({ queryKey: ['games'] });
              break;
              
            case 'game_created':
            case 'game_updated':
            case 'game_deleted':
              queryClient.invalidateQueries({ queryKey: ['games'] });
              break;
          }
        }
        break;
        
      case 'error':
        console.error('❌ SSE hibaüzenet:', data.message);
        break;
        
      default:
        console.log('📨 Ismeretlen SSE üzenet típus:', data.type);
    }
  }, [gameId, queryClient]);

  return useSSE(sseUrl, {
    ...options,
    onMessage: handleMessage,
    queryKeys: [
      ['game', gameId],
      ['games']
    ],
  });
};

/**
 * Általános SSE hook minden játékhoz
 */
export const useGeneralSSE = (options = {}) => {
  const baseUrl = getApiBaseUrl();
  const sseUrl = `${baseUrl}/api/sse/general/`;
  
  const queryClient = useQueryClient();
  // Felhasználói onMessage callback kompozícióhoz
  const userOnMessage = options?.onMessage;
  
  const handleMessage = useCallback((data, event, connect) => {
    console.log('🌐 Általános SSE üzenet:', data);
    
    switch (data.type) {
      case 'connected':
        console.log('🔌 SSE kapcsolat megerősítve:', data.message);
        break;
        
      case 'test':
        console.log('🧪 SSE teszt üzenet:', data.message);
        break;
        
      case 'heartbeat':
        // ✅ Ne loggoljuk túl gyakran a heartbeat-et
        // console.log('💓 SSE heartbeat:', data.count, data.message);
        break;
        
      case 'reconnect':
        console.log('🔄 SSE újracsatlakozás szükséges:', data.message);
        // Automatikus újracsatlakozás
        if (connect) {
          setTimeout(() => {
            console.log('🔄 SSE automatikus újracsatlakozás...');
            connect();
          }, 1000);
        }
        break;
        
      case 'game_update':
        if (data.data && data.game_id) {
          queryClient.setQueryData(['game', data.game_id], data.data);
          queryClient.setQueryData(['games'], (old) => {
            if (!old) return old;
            return old.map(game => 
              game.id === data.game_id ? data.data : game
            );
          });
        }
        break;
        
      case 'game_event':
        if (data.event) {
          const eventType = data.event.type;
          console.log(`🎯 Általános esemény: ${eventType}`, data.event);
          
          switch (eventType) {
            case 'player_joined':
            case 'player_left':
            case 'player_updated':
              if (data.event.data?.game_id) {
                // ✅ JAVÍTOTT: Invalidate helyett refetch a teljes adatokért
                queryClient.refetchQueries({ queryKey: ['game', data.event.data.game_id] });
              }
              queryClient.refetchQueries({ queryKey: ['games'] });
              break;
              
            case 'game_created':
            case 'game_updated':
            case 'game_deleted':
              // ✅ JAVÍTOTT: Invalidate helyett refetch a teljes adatokért
              queryClient.refetchQueries({ queryKey: ['games'] });
              break;
          }
        }
        break;
        
      case 'game_started':
        console.log('🚀 Játék elindult!', data);
        if (data.data?.game_id) {
          const gid2 = data.data.game_id;
          const newStatus = data.data?.status || 'separate';
          // ⚡ Optimista frissítés: részletek és lista
          queryClient.setQueryData(['game', gid2], (old) => old ? { ...old, status: newStatus } : old);
          queryClient.setQueryData(['games'], (old) => {
            if (!Array.isArray(old)) return old;
            return old.map(g => g.id === gid2 ? { ...g, status: newStatus } : g);
          });
          // 🔄 Részletek refetch
          queryClient.refetchQueries({ queryKey: ['game', gid2] });
          // 🔄 Összes csapat aktuális feladata ennek a játéknak
          queryClient.refetchQueries({
            predicate: (q) => Array.isArray(q.queryKey)
              && q.queryKey[0] === 'challenge'
              && q.queryKey[1] === gid2
          });
        }
        // 🔄 Lista refetch
        queryClient.refetchQueries({ queryKey: ['games'] });
        break;
        
      case 'player_joined':
        console.log('👥 Játékos csatlakozott!', data);
        const gid = data.data?.game_id;
        const pid = data.data?.player_id;
        const pname = data.data?.player_name;
        const team = data.data?.team;
        if (gid) {
          // ⚡ Optimista frissítés: játéklista
          queryClient.setQueryData(['games'], (old) => {
            if (!Array.isArray(old)) return old;
            return old.map(g => {
              if (g.id !== gid) return g;
              const teams = Array.isArray(g.teams) ? g.teams.map(t => {
                if (t.name !== team) return t;
                const exists = (t.players || []).some(p => p.id === pid);
                return exists ? t : { ...t, players: [...(t.players || []), { id: pid, name: pname }] };
              }) : g.teams;
              const alreadyCounted = Array.isArray(g.teams)
                ? ((g.teams.find(t => t.name === team)?.players || []).some(p => p.id === pid))
                : false;
              const total_players = (g.total_players || 0) + (alreadyCounted ? 0 : 1);
              return { ...g, teams, total_players };
            });
          });
          // ⚡ Optimista frissítés: játék részletek
          queryClient.setQueryData(['game', gid], (old) => {
            if (!old) return old;
            const teams = Array.isArray(old.teams) ? old.teams.map(t => {
              if (t.name !== team) return t;
              const exists = (t.players || []).some(p => p.id === pid);
              return exists ? t : { ...t, players: [...(t.players || []), { id: pid, name: pname }] };
            }) : old.teams;
            return { ...old, teams };
          });
          // 🔄 Háttér refetch a konzisztenciáért
          queryClient.refetchQueries({ queryKey: ['game', gid] });
        }
        queryClient.refetchQueries({ queryKey: ['games'] });
        break;
        
      case 'player_updated':
        console.log('👤 Játékos frissítve!', data);
        if (data.data?.game_id) {
          // ✅ JAVÍTOTT: Invalidate helyett refetch a teljes adatokért
          queryClient.refetchQueries({ queryKey: ['game', data.data.game_id] });
        }
        queryClient.refetchQueries({ queryKey: ['games'] });
        break;
        
      case 'game_updated':
        console.log('🎮 Játék frissítve!', data);
        if (data.data?.game_id) {
          // ✅ Azonnali újra lekérés a részletekre
          queryClient.refetchQueries({ queryKey: ['game', data.data.game_id] });
          // ✅ Ha a státusz futó fázisra váltott, a csapatfeladatok is frissüljenek
          if (data.data?.status === 'separate' || data.data?.status === 'together') {
            queryClient.refetchQueries({
              predicate: (q) => Array.isArray(q.queryKey)
                && q.queryKey[0] === 'challenge'
                && q.queryKey[1] === data.data.game_id
            });
          }
        }
        // ✅ Azonnali újra lekérés a lista adatokra
        queryClient.refetchQueries({ queryKey: ['games'] });
        break;
        
      case 'game_created':
        console.log('🎉 Új játék létrehozva!', data);
        console.log('🔄 Refetching games list after game creation...');
        // ✅ JAVÍTOTT: Invalidate helyett refetch a teljes adatokért
        queryClient.refetchQueries({ queryKey: ['games'] });
        console.log('✅ Games list refetched after game creation');
        break;
        
      case 'error':
        console.error('❌ SSE hibaüzenet:', data.message);
        break;
        
      default:
        console.log('📨 Ismeretlen SSE üzenet típus:', data.type);
    }
    // Hívó által megadott onMessage callback meghívása a belső feldolgozás után
    if (typeof userOnMessage === 'function') {
      try {
        userOnMessage(data, event, connect);
      } catch (e) {
        console.error('❌ Hiba a felhasználói onMessage callbackben:', e);
      }
    }
  }, [queryClient, userOnMessage]);

  return useSSE(sseUrl, {
    ...options,
    onMessage: handleMessage,
  });
};
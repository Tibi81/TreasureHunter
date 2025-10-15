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
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const eventSourceRef = useRef(null);
  const queryClient = useQueryClient();
  
  const {
    onMessage = () => {},
    onError = () => {},
    onOpen = () => {},
    onClose = () => {},
    enabled = true,
    queryKeys = [], // React Query kulcsok amiket frissíteni kell
    maxReconnectAttempts = 5, // Maximum újracsatlakozási kísérletek
  } = options;

  const connect = useCallback(() => {
    if (!enabled || !url) return;
    
    try {
      // Megszakítjuk a korábbi kapcsolatot
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      console.log('🔌 SSE kapcsolat létrehozása:', url);
      
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = (event) => {
        console.log('✅ SSE kapcsolat létrejött');
        setIsConnected(true);
        setError(null);
        setReconnectAttempts(0); // Reset újracsatlakozási számláló
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
          
          onMessage(data, event);
        } catch (err) {
          console.error('❌ SSE üzenet feldolgozási hiba:', err);
        }
      };

      eventSource.onerror = (event) => {
        console.error('❌ SSE kapcsolat hiba:', event);
        setIsConnected(false);
        setError('SSE kapcsolat hiba');
        onError(event);
        
        // Intelligens újracsatlakozás
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff, max 30s
          console.log(`🔄 SSE újracsatlakozás ${reconnectAttempts + 1}/${maxReconnectAttempts} (${delay}ms késéssel)...`);
          
          setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, delay);
        } else {
          console.error('❌ SSE újracsatlakozás sikertelen - maximum kísérletek száma elérve');
          setError('SSE kapcsolat nem állítható helyre');
        }
      };

      eventSource.addEventListener('close', () => {
        console.log('🔌 SSE kapcsolat bezárva');
        setIsConnected(false);
        onClose();
      });

    } catch (err) {
      console.error('❌ SSE kapcsolat létrehozási hiba:', err);
      setError(err.message);
    }
  }, [url, enabled, onMessage, onError, onOpen, onClose, queryClient, queryKeys]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('🔌 SSE kapcsolat megszakítása');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    if (enabled && url) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, url, connect, disconnect]);

  return {
    isConnected,
    error,
    connect,
    disconnect,
  };
};

/**
 * Játék-specifikus SSE hook
 */
export const useGameSSE = (gameId, options = {}) => {
  // Központosított API URL használata
  const baseUrl = getApiBaseUrl();
  const sseUrl = gameId ? `${baseUrl}/api/sse/game/${gameId}/` : null;
  
  const queryClient = useQueryClient();
  
  const handleMessage = useCallback((data, event) => {
    console.log('🎮 Játék SSE üzenet:', data);
    
    switch (data.type) {
      case 'game_update':
        // Játék adatok frissítése
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
        // Esemény-alapú frissítés
        if (data.event) {
          const eventType = data.event.type;
          console.log(`🎯 Játék esemény: ${eventType}`, data.event);
          
          // Cache invalidálás esemény típus alapján
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
  // Központosított API URL használata
  const baseUrl = getApiBaseUrl();
  const sseUrl = `${baseUrl}/api/sse/general/`; // Általános SSE endpoint
  
  const queryClient = useQueryClient();
  
  const handleMessage = useCallback((data, event) => {
    console.log('🌐 Általános SSE üzenet:', data);
    
    switch (data.type) {
      case 'connected':
        console.log('🔌 SSE kapcsolat megerősítve:', data.message);
        break;
        
      case 'test':
        console.log('🧪 SSE teszt üzenet:', data.message);
        break;
        
      case 'heartbeat':
        console.log('💓 SSE heartbeat:', data.count, data.message);
        break;
        
      case 'game_update':
        // Játék adatok frissítése
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
        // Esemény-alapú frissítés
        if (data.event) {
          const eventType = data.event.type;
          console.log(`🎯 Általános esemény: ${eventType}`, data.event);
          
          // Cache invalidálás esemény típus alapján
          switch (eventType) {
            case 'player_joined':
            case 'player_left':
            case 'player_updated':
              if (data.event.data?.game_id) {
                queryClient.invalidateQueries({ queryKey: ['game', data.event.data.game_id] });
              }
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
  }, [queryClient]);

  return useSSE(sseUrl, {
    ...options,
    onMessage: handleMessage,
  });
};

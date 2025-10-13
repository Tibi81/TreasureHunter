// services/api.js
// ---------------------------
// Dinamikus API URL kezelés a frontend számára
// ---------------------------

const getApiBaseUrl = () => {
  // Fejlesztési környezet (helyi szerver)
  if (import.meta.env.MODE === "development") {
    return "http://127.0.0.1:8000";
  }

  // Éles környezet (Render backend domain)
  return "https://treasurehunter-mz1x.onrender.com";
};

export const API_BASE_URL = getApiBaseUrl();

// Használat példa:
// fetch(`${API_BASE_URL}/api/game/find/?format=json`)



class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

// CSRF token cache
let csrfToken = null;
let csrfTokenPromise = null;

// CSRF token lekérdezése
const getCSRFToken = async () => {
  // Ha már van folyamatban lévő kérés, várjuk meg azt
  if (csrfTokenPromise) {
    return await csrfTokenPromise;
  }
  
  // Ha már van token, használjuk azt
  if (csrfToken) {
    return csrfToken;
  }
  
  // Új token lekérdezése
  csrfTokenPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/csrf-token/`, {
        method: 'GET',
        credentials: 'include' // Cookie-k küldése
      });
      
      if (!response.ok) {
        throw new Error(`CSRF token kérés sikertelen: ${response.status}`);
      }
      
      const data = await response.json();
      csrfToken = data.csrf_token;
      return csrfToken;
    } catch (error) {
      console.error('CSRF token lekérdezési hiba:', error);
      throw new APIError('CSRF token lekérdezési hiba', 0);
    } finally {
      csrfTokenPromise = null;
    }
  })();
  
  return await csrfTokenPromise;
};

const apiRequest = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // CSRF token hozzáadása POST, PUT, DELETE, PATCH kérésekhez
    const needsCSRF = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method || 'GET');
    let csrfToken = null;
    
    if (needsCSRF) {
      try {
        csrfToken = await getCSRFToken();
        console.log('CSRF token lekérdezve:', csrfToken);
      } catch (error) {
        console.error('CSRF token lekérdezési hiba:', error);
        throw new APIError('CSRF token lekérdezési hiba', 0);
      }
    }
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken && { 'X-CSRFToken': csrfToken }),
        ...options.headers,
      },
      credentials: 'include', // Cookie-k küldése
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    console.log('API kérés:', url, config);
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API hiba:', response.status, errorData);
      throw new APIError(
        errorData.error || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    console.error('API kérés hiba:', error);
    throw new APIError('Hálózati hiba', 0);
  }
};

export const gameAPI = {
  // Játék keresése kód alapján
  findGameByCode: async (gameCode) => {
    return apiRequest(`/api/game/code/${gameCode.toUpperCase()}/`);
  },


  // Új játék létrehozása (Admin)
  createGame: async (gameName = 'Halloween Kincskereső', adminName = 'Admin', maxPlayers = 4, teamCount = 2) => {
    return apiRequest('/api/game/create/', {
      method: 'POST',
      body: { 
        name: gameName, 
        admin_name: adminName,
        max_players: maxPlayers,
        team_count: teamCount
      }
    });
  },

  // Játék indítása (Admin)
  startGame: async (gameId) => {
    return apiRequest(`/api/game/${gameId}/start/`, {
      method: 'POST'
    });
  },

  // Játék visszaállítása
  resetGame: async (gameId) => {
    return apiRequest(`/api/game/${gameId}/reset/`, {
      method: 'DELETE'
    });
  },

  // Játékos csatlakozás
  joinGame: async (gameId, playerName, teamName) => {
    return apiRequest(`/api/game/${gameId}/join/`, {
      method: 'POST',
      body: {
        name: playerName,
        team: teamName
      }
    });
  },

  // Játék állapot lekérdezése
  getGameStatus: async (gameId) => {
    return apiRequest(`/api/game/${gameId}/status/`);
  },

  // Aktuális feladat lekérdezése
  getCurrentChallenge: async (gameId, teamName) => {
    return apiRequest(`/api/game/${gameId}/team/${teamName}/challenge/`);
  },

  // QR kód validálása
  validateQR: async (gameId, teamName, qrCode) => {
    return apiRequest(`/api/game/${gameId}/team/${teamName}/validate/`, {
      method: 'POST',
      body: { qr_code: qrCode }
    });
  },

  // Segítség kérése
  getHelp: async (gameId, teamName) => {
    return apiRequest(`/api/game/${gameId}/team/${teamName}/help/`, {
      method: 'POST'
    });
  },

  // Játékos pozíció lekérdezése
  getPlayerStatus: async () => {
    return apiRequest('/api/player/status/');
  },

  // Játékos session ellenőrzése
  checkPlayerSession: async () => {
    return apiRequest('/api/player/check-session/');
  },

  // Játékos kilépése a játékból
  exitGame: async () => {
    const sessionToken = localStorage.getItem('session_token');
    return apiRequest('/api/player/exit/', {
      method: 'POST',
      body: { session_token: sessionToken }
    });
  },

  // Session token alapú visszacsatlakozás
  restoreSession: async (sessionToken) => {
    return apiRequest('/api/player/restore-session/', {
      method: 'POST',
      body: { session_token: sessionToken }
    });
  },

  // Játékos kijelentkezése (session token érvénytelenítése)
  logoutPlayer: async () => {
    const sessionToken = localStorage.getItem('session_token');
    return apiRequest('/api/player/logout/', {
      method: 'POST',
      body: { session_token: sessionToken }
    });
  },

  // Admin funkciók
  // Összes játék listázása
  listGames: async () => {
    return apiRequest('/api/admin/games/');
  },

  // Játék szerkesztése
  updateGame: async (gameId, gameData) => {
    return apiRequest(`/api/game/${gameId}/update/`, {
      method: 'PUT',
      body: gameData
    });
  },

  // Játék törlése
  deleteGame: async (gameId) => {
    return apiRequest(`/api/game/${gameId}/delete/`, {
      method: 'DELETE'
    });
  },

  // Játék leállítása
  stopGame: async (gameId) => {
    return apiRequest(`/api/game/${gameId}/stop/`, {
      method: 'POST'
    });
  },

  // Játékos kezelés
  // Játékos eltávolítása
  removePlayer: async (gameId, playerId) => {
    return apiRequest(`/api/game/${gameId}/player/${playerId}/remove/`, {
      method: 'DELETE'
    });
  },

  // Játékos áthelyezése
  movePlayer: async (gameId, playerId, newTeam) => {
    return apiRequest(`/api/game/${gameId}/player/${playerId}/move/`, {
      method: 'POST',
      body: { new_team: newTeam }
    });
  },

  // Játékos hozzáadása
  addPlayer: async (gameId, playerName, teamName) => {
    return apiRequest(`/api/game/${gameId}/player/add/`, {
      method: 'POST',
      body: { name: playerName, team: teamName }
    });
  }
};

// Utility függvények
export const utils = {
  // Csapat név formázása
  formatTeamName: (teamName) => {
    const teamNames = {
      'pumpkin': '🎃 Tök Csapat',
      'ghost': '👻 Szellem Csapat'
    };
    return teamNames[teamName] || teamName;
  },

  // Állomás ikon lekérdezése
  getStationIcon: (stationNumber) => {
    const icons = {
      1: '🎃',
      2: '👻', 
      3: '🕷️',
      4: '🦇',
      5: '💀',
      6: '🧙‍♀️'
    };
    return icons[stationNumber] || '❓';
  },

  // Játék fázis szövege
  getPhaseText: (status) => {
    const phases = {
      'setup': 'Várakozás játékosokra...',
      'separate': 'Külön fázis - versenyzés!',
      'together': 'Közös fázis - együttműködés!',
      'finished': 'Játék befejezve!'
    };
    return phases[status] || status;
  }
};

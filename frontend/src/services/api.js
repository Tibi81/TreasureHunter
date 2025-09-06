// services/api.js
const API_BASE_URL = 'http://localhost:8000';

class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

const apiRequest = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
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
    throw new APIError('Hálózati hiba', 0);
  }
};

export const gameAPI = {
  // Új játék létrehozása
  createGame: async (gameName = 'Halloween Kincskereső') => {
    return apiRequest('/api/game/create/', {
      method: 'POST',
      body: { name: gameName }
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
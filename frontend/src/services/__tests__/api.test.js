import { describe, it, expect, vi, beforeEach } from 'vitest'
import { gameAPI, utils } from '../api'

// Mock fetch
global.fetch = vi.fn()

describe('API Service', () => {
  beforeEach(() => {
    fetch.mockClear()
    localStorage.clear()
  })

  describe('gameAPI', () => {
    describe('findGameByCode', () => {
      it('should find game by code successfully', async () => {
        const mockResponse = {
          id: 'test-game-id',
          name: 'Test Game',
          game_code: 'ABC123'
        }
        
        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })

        const result = await gameAPI.findGameByCode('abc123')
        
        expect(fetch).toHaveBeenCalledWith(
          'http://127.0.0.1:8000/api/game/code/ABC123/',
          expect.objectContaining({
            headers: { 'Content-Type': 'application/json' }
          })
        )
        expect(result).toEqual(mockResponse)
      })

      it('should handle API error', async () => {
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: 'Game not found' })
        })

        await expect(gameAPI.findGameByCode('INVALID')).rejects.toThrow('Game not found')
      })

      it('should handle network error', async () => {
        fetch.mockRejectedValueOnce(new Error('Network error'))

        await expect(gameAPI.findGameByCode('ABC123')).rejects.toThrow('Hálózati hiba')
      })
    })

    describe('createGame', () => {
      it('should create game successfully', async () => {
        const mockResponse = {
          id: 'new-game-id',
          name: 'New Game',
          max_players: 4,
          team_count: 2
        }
        
        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })

        const result = await gameAPI.createGame('New Game', 'Admin', 4, 2)
        
        expect(fetch).toHaveBeenCalledWith(
          'http://127.0.0.1:8000/api/game/create/',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              name: 'New Game',
              admin_name: 'Admin',
              max_players: 4,
              team_count: 2
            })
          })
        )
        expect(result).toEqual(mockResponse)
      })
    })

    describe('joinGame', () => {
      it('should join game successfully', async () => {
        const mockResponse = {
          player_id: 'player-id',
          session_token: 'session-token',
          team: 'pumpkin'
        }
        
        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })

        const result = await gameAPI.joinGame('game-id', 'Player Name', 'pumpkin')
        
        expect(fetch).toHaveBeenCalledWith(
          'http://127.0.0.1:8000/api/game/game-id/join/',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              name: 'Player Name',
              team: 'pumpkin'
            })
          })
        )
        expect(result).toEqual(mockResponse)
      })
    })

    describe('validateQR', () => {
      it('should validate QR code successfully', async () => {
        const mockResponse = {
          valid: true,
          message: 'QR code valid'
        }
        
        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })

        const result = await gameAPI.validateQR('game-id', 'pumpkin', 'qr-code')
        
        expect(fetch).toHaveBeenCalledWith(
          'http://127.0.0.1:8000/api/game/game-id/team/pumpkin/validate/',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ qr_code: 'qr-code' })
          })
        )
        expect(result).toEqual(mockResponse)
      })
    })

    describe('getHelp', () => {
      it('should get help successfully', async () => {
        const mockResponse = {
          help_text: 'This is help text'
        }
        
        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })

        const result = await gameAPI.getHelp('game-id', 'pumpkin')
        
        expect(fetch).toHaveBeenCalledWith(
          'http://127.0.0.1:8000/api/game/game-id/team/pumpkin/help/',
          expect.objectContaining({
            method: 'POST'
          })
        )
        expect(result).toEqual(mockResponse)
      })
    })

    describe('exitGame', () => {
      it('should exit game successfully', async () => {
        localStorage.setItem('session_token', 'test-token')
        
        const mockResponse = {
          message: 'Player exited successfully'
        }
        
        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })

        const result = await gameAPI.exitGame()
        
        expect(fetch).toHaveBeenCalledWith(
          'http://127.0.0.1:8000/api/player/exit/',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ session_token: 'test-token' })
          })
        )
        expect(result).toEqual(mockResponse)
      })
    })

    describe('restoreSession', () => {
      it('should restore session successfully', async () => {
        const mockResponse = {
          player_id: 'player-id',
          game_id: 'game-id',
          team: 'pumpkin'
        }
        
        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })

        const result = await gameAPI.restoreSession('session-token')
        
        expect(fetch).toHaveBeenCalledWith(
          'http://127.0.0.1:8000/api/player/restore-session/',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ session_token: 'session-token' })
          })
        )
        expect(result).toEqual(mockResponse)
      })
    })

    describe('admin functions', () => {
      it('should list games successfully', async () => {
        const mockResponse = [
          { id: 'game1', name: 'Game 1' },
          { id: 'game2', name: 'Game 2' }
        ]
        
        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })

        const result = await gameAPI.listGames()
        
        expect(fetch).toHaveBeenCalledWith(
          'http://127.0.0.1:8000/api/admin/games/',
          expect.objectContaining({
            headers: { 'Content-Type': 'application/json' }
          })
        )
        expect(result).toEqual(mockResponse)
      })

      it('should remove player successfully', async () => {
        const mockResponse = {
          message: 'Player removed successfully'
        }
        
        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })

        const result = await gameAPI.removePlayer('game-id', 'player-id')
        
        expect(fetch).toHaveBeenCalledWith(
          'http://127.0.0.1:8000/api/game/game-id/player/player-id/remove/',
          expect.objectContaining({
            method: 'DELETE'
          })
        )
        expect(result).toEqual(mockResponse)
      })

      it('should move player successfully', async () => {
        const mockResponse = {
          message: 'Player moved successfully'
        }
        
        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })

        const result = await gameAPI.movePlayer('game-id', 'player-id', 'ghost')
        
        expect(fetch).toHaveBeenCalledWith(
          'http://127.0.0.1:8000/api/game/game-id/player/player-id/move/',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ new_team: 'ghost' })
          })
        )
        expect(result).toEqual(mockResponse)
      })
    })
  })

  describe('utils', () => {
    describe('formatTeamName', () => {
      it('should format team names correctly', () => {
        expect(utils.formatTeamName('pumpkin')).toBe('🎃 Tök Csapat')
        expect(utils.formatTeamName('ghost')).toBe('👻 Szellem Csapat')
        expect(utils.formatTeamName('unknown')).toBe('unknown')
      })
    })

    describe('getStationIcon', () => {
      it('should return correct station icons', () => {
        expect(utils.getStationIcon(1)).toBe('🎃')
        expect(utils.getStationIcon(2)).toBe('👻')
        expect(utils.getStationIcon(3)).toBe('🕷️')
        expect(utils.getStationIcon(4)).toBe('🦇')
        expect(utils.getStationIcon(5)).toBe('💀')
        expect(utils.getStationIcon(6)).toBe('🧙‍♀️')
        expect(utils.getStationIcon(7)).toBe('❓')
      })
    })

    describe('getPhaseText', () => {
      it('should return correct phase texts', () => {
        expect(utils.getPhaseText('setup')).toBe('Várakozás játékosokra...')
        expect(utils.getPhaseText('separate')).toBe('Külön fázis - versenyzés!')
        expect(utils.getPhaseText('together')).toBe('Közös fázis - együttműködés!')
        expect(utils.getPhaseText('finished')).toBe('Játék befejezve!')
        expect(utils.getPhaseText('unknown')).toBe('unknown')
      })
    })
  })
})

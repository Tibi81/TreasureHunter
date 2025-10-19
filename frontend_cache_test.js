// frontend_cache_test.js - Frontend Cache Synchronization Test
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminPanel from './src/components/AdminPanel';
import { gameAPI } from './src/services/api';

// Mock API responses
const mockGames = [
  {
    id: '1',
    name: 'Test Game 1',
    game_code: 'ABC123',
    created_by: 'Admin',
    status: 'waiting',
    max_players: 4,
    team_count: 2,
    players: []
  },
  {
    id: '2', 
    name: 'Test Game 2',
    game_code: 'DEF456',
    created_by: 'Admin',
    status: 'waiting',
    max_players: 6,
    team_count: 2,
    players: []
  }
];

const mockCreateGameResponse = {
  game: {
    id: '3',
    name: 'New Test Game',
    game_code: 'GHI789',
    created_by: 'Test Admin',
    status: 'waiting',
    max_players: 4,
    team_count: 2,
    players: []
  },
  message: 'Játék sikeresen létrehozva!'
};

// Mock API
jest.mock('./src/services/api', () => ({
  gameAPI: {
    listGames: jest.fn(),
    createGame: jest.fn(),
    deleteGame: jest.fn(),
  },
}));

class FrontendCacheTest {
  constructor() {
    this.queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0,
          staleTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });
    this.testResults = {};
  }

  async runAllTests() {
    console.log('🧪 FRONTEND CACHE SYNCHRONIZATION TEST SUITE');
    console.log('='.repeat(60));
    
    // Test 1: Cache consistency
    await this.testCacheConsistency();
    
    // Test 2: Optimistic updates
    await this.testOptimisticUpdates();
    
    // Test 3: Mutation callbacks
    await this.testMutationCallbacks();
    
    // Summary
    this.printSummary();
  }

  async testCacheConsistency() {
    console.log('\n📋 TESTING CACHE CONSISTENCY');
    console.log('='.repeat(50));
    
    try {
      // Mock API responses
      gameAPI.listGames.mockResolvedValue({ games: mockGames });
      
      // Render component
      const { container } = render(
        <QueryClientProvider client={this.queryClient}>
          <AdminPanel onBack={() => {}} />
        </QueryClientProvider>
      );
      
      // Wait for games to load
      await waitFor(() => {
        expect(screen.getByText('Test Game 1')).toBeInTheDocument();
        expect(screen.getByText('Test Game 2')).toBeInTheDocument();
      });
      
      // Check cache data
      const cachedGames = this.queryClient.getQueryData(['games', 'list']);
      const simpleCachedGames = this.queryClient.getQueryData(['games']);
      
      const cacheConsistent = 
        cachedGames?.length === mockGames.length &&
        simpleCachedGames?.length === mockGames.length;
      
      if (cacheConsistent) {
        console.log('✅ Cache consistency: PASSED');
        this.testResults.cacheConsistency = { passed: true, error: null };
      } else {
        console.log('❌ Cache consistency: FAILED');
        this.testResults.cacheConsistency = { 
          passed: false, 
          error: 'Cache data inconsistent' 
        };
      }
      
    } catch (error) {
      console.log(`❌ Cache consistency: ERROR - ${error.message}`);
      this.testResults.cacheConsistency = { passed: false, error: error.message };
    }
  }

  async testOptimisticUpdates() {
    console.log('\n🚀 TESTING OPTIMISTIC UPDATES');
    console.log('='.repeat(50));
    
    try {
      // Mock API responses
      gameAPI.listGames.mockResolvedValue({ games: mockGames });
      gameAPI.createGame.mockResolvedValue(mockCreateGameResponse);
      
      // Render component
      const { container } = render(
        <QueryClientProvider client={this.queryClient}>
          <AdminPanel onBack={() => {}} />
        </QueryClientProvider>
      );
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Test Game 1')).toBeInTheDocument();
      });
      
      // Fill form and create game
      const nameInput = screen.getByPlaceholderText('Játék neve');
      const adminInput = screen.getByPlaceholderText('Admin neve');
      const createButton = screen.getByText('Játék létrehozása');
      
      fireEvent.change(nameInput, { target: { value: 'New Test Game' } });
      fireEvent.change(adminInput, { target: { value: 'Test Admin' } });
      
      // Check initial game count
      const initialGameCount = screen.getAllByText(/Test Game/).length;
      
      // Create game
      fireEvent.click(createButton);
      
      // Check optimistic update (should appear immediately)
      await waitFor(() => {
        const newGameCount = screen.getAllByText(/Test Game/).length;
        expect(newGameCount).toBeGreaterThan(initialGameCount);
      }, { timeout: 1000 });
      
      console.log('✅ Optimistic updates: PASSED');
      this.testResults.optimisticUpdates = { passed: true, error: null };
      
    } catch (error) {
      console.log(`❌ Optimistic updates: ERROR - ${error.message}`);
      this.testResults.optimisticUpdates = { passed: false, error: error.message };
    }
  }

  async testMutationCallbacks() {
    console.log('\n🔄 TESTING MUTATION CALLBACKS');
    console.log('='.repeat(50));
    
    try {
      // Mock API responses
      gameAPI.listGames.mockResolvedValue({ games: mockGames });
      gameAPI.deleteGame.mockResolvedValue({ message: 'Játék sikeresen törölve!' });
      
      // Render component
      const { container } = render(
        <QueryClientProvider client={this.queryClient}>
          <AdminPanel onBack={() => {}} />
        </QueryClientProvider>
      );
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Test Game 1')).toBeInTheDocument();
      });
      
      // Find delete button for first game
      const deleteButtons = screen.getAllByText('Törlés');
      const firstDeleteButton = deleteButtons[0];
      
      // Check initial game count
      const initialGameCount = screen.getAllByText(/Test Game/).length;
      
      // Delete game
      fireEvent.click(firstDeleteButton);
      
      // Check optimistic update (should disappear immediately)
      await waitFor(() => {
        const newGameCount = screen.getAllByText(/Test Game/).length;
        expect(newGameCount).toBeLessThan(initialGameCount);
      }, { timeout: 1000 });
      
      console.log('✅ Mutation callbacks: PASSED');
      this.testResults.mutationCallbacks = { passed: true, error: null };
      
    } catch (error) {
      console.log(`❌ Mutation callbacks: ERROR - ${error.message}`);
      this.testResults.mutationCallbacks = { passed: false, error: error.message };
    }
  }

  printSummary() {
    console.log('\n📋 FRONTEND CACHE TEST SUMMARY');
    console.log('='.repeat(60));
    
    const totalTests = Object.keys(this.testResults).length;
    const passedTests = Object.values(this.testResults).filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`📊 Tests run: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    
    console.log('\n📈 DETAILED RESULTS:');
    for (const [testName, result] of Object.entries(this.testResults)) {
      const status = result.passed ? '✅' : '❌';
      console.log(`  ${status} ${testName}: ${result.passed ? 'PASSED' : 'FAILED'}`);
      if (!result.passed && result.error) {
        console.log(`     Error: ${result.error}`);
      }
    }
    
    // Overall assessment
    if (failedTests === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Frontend cache is working correctly.');
    } else {
      console.log(`\n⚠️ ${failedTests} test(s) failed. Frontend cache needs attention.`);
    }
  }
}

// Export for use in other test files
export default FrontendCacheTest;

// Run tests if called directly
if (require.main === module) {
  const tester = new FrontendCacheTest();
  tester.runAllTests();
}



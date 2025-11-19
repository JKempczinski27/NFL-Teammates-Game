/**
 * Global Test Setup
 * Runs before all tests to configure the testing environment
 */

// Set test environment variables
process.env.NODE_ENV = 'test';

// Increase timeout for slower operations
jest.setTimeout(30000);

// Global test utilities
global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Suppress console output during tests (optional - comment out if you want to see logs)
global.console = {
  ...console,
  // Uncomment the lines below to suppress logs during tests
  // log: jest.fn(),
  // error: jest.fn(),
  // warn: jest.fn(),
  // info: jest.fn(),
};

// Clean up after all tests
afterAll(async () => {
  // Give time for async operations to complete
  await new Promise(resolve => setTimeout(resolve, 500));
});

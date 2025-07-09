// Jest setup file for backend tests

// Increase timeout for database operations
jest.setTimeout(10000);

// Suppress console.log during tests to keep output clean
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

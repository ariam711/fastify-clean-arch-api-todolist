import { afterAll, beforeAll, vi } from 'vitest';

// Set test environment variables before any imports
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.MONGODB_URI = 'mongodb://localhost:27017';
process.env.MONGODB_DATABASE = 'test_todolist';
process.env.PORT = '3001';
process.env.HOST = '127.0.0.1';

beforeAll(() => {
  // Global test setup
});

afterAll(() => {
  // Global test teardown
  vi.clearAllMocks();
});

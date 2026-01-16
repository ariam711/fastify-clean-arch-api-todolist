import * as path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/index.ts',
        'src/**/*.d.ts',
        'src/**/types.ts',
        'src/**/types/index.ts',
        'src/**/index.ts',
        'src/interfaces/http/server.ts', // Entry point - tested via integration
        'src/interfaces/http/app.ts', // Factory tested via integration
        'src/interfaces/http/routes/**', // Routes tested via integration
        'src/domain/shared/value-object.ts', // Base class not used yet
        'src/application/ports/**', // Interfaces only, no logic
        'src/infrastructure/database/mongodb.connection.ts', // Tested via integration
        'src/infrastructure/repositories/**', // Repositories tested via integration
        'src/config/env.ts', // Config validation - env-specific branches
      ],
      thresholds: {
        statements: 85,
        branches: 85,
        functions: 85,
        lines: 85,
      },
    },
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, './src/application'),
      '@config': path.resolve(__dirname, './src/config'),
      '@domain': path.resolve(__dirname, './src/domain'),
      '@infra': path.resolve(__dirname, './src/infrastructure'),
      '@interface': path.resolve(__dirname, './src/interfaces'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
});

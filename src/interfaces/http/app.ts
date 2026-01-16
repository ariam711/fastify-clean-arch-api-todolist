import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { AwilixContainer } from 'awilix';
import Fastify, { type FastifyInstance } from 'fastify';
import type { Db } from 'mongodb';

import { env } from '../../config/env.js';
import { createDIContainer } from './container.js';
import { correlationIdHook, correlationIdResponseHook, errorHandler } from './middleware/index.js';
import { labelRoutes, projectRoutes, taskRoutes } from './routes/index.js';

declare module 'fastify' {
  interface FastifyInstance {
    diContainer: AwilixContainer;
  }
}

export interface BuildAppOptions {
  db: Db;
}

export async function buildApp(options: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: { colorize: true },
            }
          : undefined,
    },
    requestIdHeader: 'x-correlation-id',
    requestIdLogLabel: 'correlationId',
  });

  // Create and attach DI container
  const container = createDIContainer({ db: options.db });
  app.decorate('diContainer', container);

  // Register plugins
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  // OpenAPI/Swagger
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'TODO List API',
        description: 'Production-ready TODO List REST API with Clean Architecture',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://${env.HOST}:${env.PORT}`,
          description: 'Development server',
        },
      ],
      tags: [
        { name: 'Projects', description: 'Project management endpoints' },
        { name: 'Tasks', description: 'Task management endpoints' },
        { name: 'Labels', description: 'Label management endpoints' },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // Add hooks
  app.addHook('onRequest', correlationIdHook);
  app.addHook('onSend', correlationIdResponseHook);

  // Set error handler
  app.setErrorHandler(errorHandler);

  // Health check
  app.get(
    '/health',
    {
      schema: {
        tags: ['Health'],
        summary: 'Health check endpoint',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    async () => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
    }),
  );

  // Register routes
  await app.register(projectRoutes, { prefix: '/projects' });
  await app.register(taskRoutes, { prefix: '/tasks' });
  await app.register(labelRoutes, { prefix: '/labels' });

  return app;
}

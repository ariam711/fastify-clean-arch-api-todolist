import { env } from '@config/env.js';
import { connectToDatabase, disconnectFromDatabase } from '@infra/database/mongodb.connection.js';
import type { FastifyInstance } from 'fastify';
import { buildApp } from './app.js';

async function start(): Promise<void> {
  let app: FastifyInstance | undefined;

  try {
    // Connect to database
    const db = await connectToDatabase({
      uri: env.MONGODB_URI,
      database: env.MONGODB_DATABASE,
    });

    console.log('✅ Connected to MongoDB');

    // Build and start the app
    app = await buildApp({ db });

    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    console.log(`🚀 Server running at http://${env.HOST}:${env.PORT}`);
    console.log(`📚 API docs available at http://${env.HOST}:${env.PORT}/docs`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await disconnectFromDatabase();
    process.exit(1);
  }

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(`\n📤 Received ${signal}, shutting down gracefully...`);
      try {
        if (app) {
          await app.close();
        }
        await disconnectFromDatabase();
        console.log('👋 Server closed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    });
  });
}

start();

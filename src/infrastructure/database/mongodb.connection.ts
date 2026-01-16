import { type Db, MongoClient } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

export interface MongoDBConnectionOptions {
  uri: string;
  database: string;
}

export async function connectToDatabase(options: MongoDBConnectionOptions): Promise<Db> {
  if (db) {
    return db;
  }

  client = new MongoClient(options.uri, {
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
  });

  await client.connect();
  db = client.db(options.database);

  // Create indexes
  await createIndexes(db);

  return db;
}

export async function disconnectFromDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

export function getDatabase(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectToDatabase first.');
  }
  return db;
}

async function createIndexes(database: Db): Promise<void> {
  // Project indexes
  await database.collection('projects').createIndex({ name: 1 }, { unique: true });
  await database.collection('projects').createIndex({ createdAt: -1 });

  // Task indexes
  await database.collection('tasks').createIndex({ projectId: 1 });
  await database.collection('tasks').createIndex({ status: 1 });
  await database.collection('tasks').createIndex({ priority: 1 });
  await database.collection('tasks').createIndex({ dueDate: 1 });
  await database.collection('tasks').createIndex({ labelIds: 1 });
  await database.collection('tasks').createIndex({ createdAt: -1 });
  await database
    .collection('tasks')
    .createIndex({ title: 'text', description: 'text' }, { name: 'task_text_search' });

  // Label indexes
  await database.collection('labels').createIndex({ projectId: 1 });
  await database.collection('labels').createIndex({ name: 1, projectId: 1 }, { unique: true });
}

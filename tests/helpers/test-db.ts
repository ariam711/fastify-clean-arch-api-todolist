import { MongoDBContainer, type StartedMongoDBContainer } from '@testcontainers/mongodb';
import { type Db, MongoClient } from 'mongodb';

let container: StartedMongoDBContainer | null = null;
let client: MongoClient | null = null;
let db: Db | null = null;

export async function startTestDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  container = await new MongoDBContainer('mongo:7').start();
  const uri = container.getConnectionString();

  client = new MongoClient(uri, { directConnection: true });
  await client.connect();

  db = client.db('test_todolist');

  // Create indexes
  await db.collection('projects').createIndex({ name: 1 }, { unique: true });
  await db.collection('tasks').createIndex({ projectId: 1 });
  await db.collection('tasks').createIndex({ status: 1 });
  await db
    .collection('tasks')
    .createIndex({ title: 'text', description: 'text' }, { name: 'task_text_search' });
  await db.collection('labels').createIndex({ projectId: 1 });
  await db.collection('labels').createIndex({ name: 1, projectId: 1 }, { unique: true });

  return db;
}

export async function stopTestDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
  }
  if (container) {
    await container.stop();
    container = null;
  }
  db = null;
}

export async function clearTestDatabase(): Promise<void> {
  if (db) {
    await db.collection('projects').deleteMany({});
    await db.collection('tasks').deleteMany({});
    await db.collection('labels').deleteMany({});
  }
}

export function getTestDatabase(): Db {
  if (!db) {
    throw new Error('Test database not started. Call startTestDatabase first.');
  }
  return db;
}

import { buildApp } from '@interface/http/app.js';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from '../../helpers/test-db.js';

describe('Task Routes Integration', () => {
  let app: FastifyInstance;
  let projectId: string;

  beforeAll(async () => {
    const db = await startTestDatabase();
    app = await buildApp({ db });
  });

  afterAll(async () => {
    await app.close();
    await stopTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
    // Create a project for tasks
    const response = await app.inject({
      method: 'POST',
      url: '/projects',
      payload: { name: 'Test Project' },
    });
    projectId = JSON.parse(response.body).id;
  });

  describe('POST /tasks', () => {
    it('should create a task', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/tasks',
        payload: { title: 'Test Task', projectId },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.title).toBe('Test Task');
      expect(body.projectId).toBe(projectId);
      expect(body.status).toBe('todo');
      expect(body.priority).toBe('medium');
    });

    it('should create a task with all fields', async () => {
      const dueDate = new Date(Date.now() + 86400000).toISOString();
      const response = await app.inject({
        method: 'POST',
        url: '/tasks',
        payload: {
          title: 'Full Task',
          description: 'A complete task',
          status: 'in_progress',
          priority: 'high',
          dueDate,
          projectId,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('in_progress');
      expect(body.priority).toBe('high');
      expect(body.description).toBe('A complete task');
    });

    it('should return 404 for non-existent project', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/tasks',
        payload: { title: 'Task', projectId: 'non-existent' },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /tasks', () => {
    it('should return tasks with filters', async () => {
      // Create tasks
      await app.inject({
        method: 'POST',
        url: '/tasks',
        payload: { title: 'Task 1', projectId, priority: 'high' },
      });
      await app.inject({
        method: 'POST',
        url: '/tasks',
        payload: { title: 'Task 2', projectId, priority: 'low' },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/tasks?projectId=${projectId}&priority=high`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].priority).toBe('high');
    });

    it('should support cursor pagination', async () => {
      // Create multiple tasks
      for (let i = 1; i <= 5; i++) {
        await app.inject({
          method: 'POST',
          url: '/tasks',
          payload: { title: `Task ${i}`, projectId },
        });
      }

      // First page
      const response1 = await app.inject({
        method: 'GET',
        url: `/tasks?projectId=${projectId}&limit=2`,
      });

      const page1 = JSON.parse(response1.body);
      expect(page1.data).toHaveLength(2);
      expect(page1.hasMore).toBe(true);
      expect(page1.nextCursor).toBeDefined();

      // Second page
      const response2 = await app.inject({
        method: 'GET',
        url: `/tasks?projectId=${projectId}&limit=2&cursor=${page1.nextCursor}`,
      });

      const page2 = JSON.parse(response2.body);
      expect(page2.data).toHaveLength(2);
    });
  });

  describe('PATCH /tasks/:id', () => {
    it('should update task status', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/tasks',
        payload: { title: 'Test', projectId },
      });
      const { id } = JSON.parse(createResponse.body);

      const response = await app.inject({
        method: 'PATCH',
        url: `/tasks/${id}`,
        payload: { status: 'in_progress' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('in_progress');
    });

    it('should return 422 for invalid status transition', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/tasks',
        payload: { title: 'Test', projectId },
      });
      const { id } = JSON.parse(createResponse.body);

      const response = await app.inject({
        method: 'PATCH',
        url: `/tasks/${id}`,
        payload: { status: 'done' }, // Cannot go from todo to done directly
      });

      expect(response.statusCode).toBe(422);
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete a task', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/tasks',
        payload: { title: 'Test', projectId },
      });
      const { id } = JSON.parse(createResponse.body);

      const response = await app.inject({
        method: 'DELETE',
        url: `/tasks/${id}`,
      });

      expect(response.statusCode).toBe(204);
    });
  });
});

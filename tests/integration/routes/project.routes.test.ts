import { buildApp } from '@interface/http/app.js';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from '../../helpers/test-db.js';

describe('Project Routes Integration', () => {
  let app: FastifyInstance;

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
  });

  describe('POST /projects', () => {
    it('should create a project', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/projects',
        payload: { name: 'Test Project', description: 'A test project' },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.name).toBe('Test Project');
      expect(body.description).toBe('A test project');
      expect(body.id).toBeDefined();
    });

    it('should return 400 for invalid request body', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/projects',
        payload: { name: '' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 409 for duplicate project name', async () => {
      await app.inject({
        method: 'POST',
        url: '/projects',
        payload: { name: 'Duplicate' },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/projects',
        payload: { name: 'Duplicate' },
      });

      expect(response.statusCode).toBe(409);
    });
  });

  describe('GET /projects', () => {
    it('should return empty list when no projects exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/projects',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toEqual([]);
      expect(body.total).toBe(0);
    });

    it('should return list of projects with pagination', async () => {
      // Create projects
      await app.inject({ method: 'POST', url: '/projects', payload: { name: 'Project 1' } });
      await app.inject({ method: 'POST', url: '/projects', payload: { name: 'Project 2' } });

      const response = await app.inject({
        method: 'GET',
        url: '/projects?limit=1&offset=0',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(1);
      expect(body.total).toBe(2);
      expect(body.hasMore).toBe(true);
    });
  });

  describe('GET /projects/:id', () => {
    it('should return project by id', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/projects',
        payload: { name: 'Test Project' },
      });
      const { id } = JSON.parse(createResponse.body);

      const response = await app.inject({
        method: 'GET',
        url: `/projects/${id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe(id);
      expect(body.name).toBe('Test Project');
    });

    it('should return 404 for non-existent project', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/projects/non-existent-id',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PATCH /projects/:id', () => {
    it('should update a project', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/projects',
        payload: { name: 'Original' },
      });
      const { id } = JSON.parse(createResponse.body);

      const response = await app.inject({
        method: 'PATCH',
        url: `/projects/${id}`,
        payload: { name: 'Updated', description: 'New description' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.name).toBe('Updated');
      expect(body.description).toBe('New description');
    });
  });

  describe('DELETE /projects/:id', () => {
    it('should delete a project without tasks', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/projects',
        payload: { name: 'Test' },
      });
      const { id } = JSON.parse(createResponse.body);

      const response = await app.inject({
        method: 'DELETE',
        url: `/projects/${id}`,
      });

      expect(response.statusCode).toBe(204);

      // Verify deletion
      const getResponse = await app.inject({
        method: 'GET',
        url: `/projects/${id}`,
      });
      expect(getResponse.statusCode).toBe(404);
    });

    it('should return 422 when trying to delete project with open tasks', async () => {
      // Create project
      const projectResponse = await app.inject({
        method: 'POST',
        url: '/projects',
        payload: { name: 'With Tasks' },
      });
      const { id: projectId } = JSON.parse(projectResponse.body);

      // Create task
      await app.inject({
        method: 'POST',
        url: '/tasks',
        payload: { title: 'Task', projectId },
      });

      // Try to delete
      const response = await app.inject({
        method: 'DELETE',
        url: `/projects/${projectId}`,
      });

      expect(response.statusCode).toBe(422);
    });

    it('should delete project with tasks when force=true', async () => {
      // Create project
      const projectResponse = await app.inject({
        method: 'POST',
        url: '/projects',
        payload: { name: 'With Tasks' },
      });
      const { id: projectId } = JSON.parse(projectResponse.body);

      // Create task
      await app.inject({
        method: 'POST',
        url: '/tasks',
        payload: { title: 'Task', projectId },
      });

      // Delete with force
      const response = await app.inject({
        method: 'DELETE',
        url: `/projects/${projectId}?force=true`,
      });

      expect(response.statusCode).toBe(204);
    });
  });
});

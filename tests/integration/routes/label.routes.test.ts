import { buildApp } from '@interface/http/app.js';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from '../../helpers/test-db.js';

describe('Label Routes Integration', () => {
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
    // Create a project for labels
    const response = await app.inject({
      method: 'POST',
      url: '/projects',
      payload: { name: 'Test Project' },
    });
    projectId = JSON.parse(response.body).id;
  });

  describe('POST /labels', () => {
    it('should create a label', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/labels',
        payload: { name: 'Bug', projectId },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.name).toBe('Bug');
      expect(body.projectId).toBe(projectId);
      expect(body.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('should create a label with custom color', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/labels',
        payload: { name: 'Feature', color: '#22c55e', projectId },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.color).toBe('#22c55e');
    });

    it('should return 409 for duplicate label name in project', async () => {
      await app.inject({
        method: 'POST',
        url: '/labels',
        payload: { name: 'Duplicate', projectId },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/labels',
        payload: { name: 'Duplicate', projectId },
      });

      expect(response.statusCode).toBe(409);
    });

    it('should allow same label name in different projects', async () => {
      // Create second project
      const project2Response = await app.inject({
        method: 'POST',
        url: '/projects',
        payload: { name: 'Project 2' },
      });
      const project2Id = JSON.parse(project2Response.body).id;

      // Create label in first project
      await app.inject({
        method: 'POST',
        url: '/labels',
        payload: { name: 'Bug', projectId },
      });

      // Create same label name in second project
      const response = await app.inject({
        method: 'POST',
        url: '/labels',
        payload: { name: 'Bug', projectId: project2Id },
      });

      expect(response.statusCode).toBe(201);
    });
  });

  describe('GET /labels', () => {
    it('should return labels for a project', async () => {
      await app.inject({
        method: 'POST',
        url: '/labels',
        payload: { name: 'Bug', projectId },
      });
      await app.inject({
        method: 'POST',
        url: '/labels',
        payload: { name: 'Feature', projectId },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/labels?projectId=${projectId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(2);
      expect(body.total).toBe(2);
    });
  });

  describe('PATCH /labels/:id', () => {
    it('should update a label', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/labels',
        payload: { name: 'Original', projectId },
      });
      const { id } = JSON.parse(createResponse.body);

      const response = await app.inject({
        method: 'PATCH',
        url: `/labels/${id}`,
        payload: { name: 'Updated', color: '#ef4444' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.name).toBe('Updated');
      expect(body.color).toBe('#ef4444');
    });
  });

  describe('DELETE /labels/:id', () => {
    it('should delete a label', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/labels',
        payload: { name: 'Test', projectId },
      });
      const { id } = JSON.parse(createResponse.body);

      const response = await app.inject({
        method: 'DELETE',
        url: `/labels/${id}`,
      });

      expect(response.statusCode).toBe(204);
    });
  });
});

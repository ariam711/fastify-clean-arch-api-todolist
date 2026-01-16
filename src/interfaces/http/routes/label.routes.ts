import type { AwilixContainer } from 'awilix';
import type { FastifyInstance } from 'fastify';
import type {
  CreateLabelUseCase,
  DeleteLabelUseCase,
  GetLabelUseCase,
  ListLabelsUseCase,
  UpdateLabelUseCase,
} from '@app/use-cases/label/index.js';
import {
  type CreateLabelBody,
  CreateLabelBodySchema,
  LabelListResponseSchema,
  LabelResponseSchema,
  type ListLabelsQuery,
  ListLabelsQuerySchema,
  type UpdateLabelBody,
  UpdateLabelBodySchema,
} from '@interface/http/dtos/label.dto.js';
import { type IdParams, IdParamsSchema } from '@interface/http/dtos/project.dto.js';

function formatLabelResponse(label: { id: string; name: string; color: string; projectId: string; createdAt: Date }) {
  return {
    id: label.id,
    name: label.name,
    color: label.color,
    projectId: label.projectId,
    createdAt: label.createdAt.toISOString(),
  };
}

export async function labelRoutes(app: FastifyInstance): Promise<void> {
  const container = app.diContainer as AwilixContainer;

  // Create label
  app.post<{ Body: CreateLabelBody }>(
    '/',
    {
      schema: {
        tags: ['Labels'],
        summary: 'Create a new label',
        body: CreateLabelBodySchema,
        response: {
          201: LabelResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const useCase = container.resolve<CreateLabelUseCase>('createLabelUseCase');
      const label = await useCase.execute(request.body);
      return reply.status(201).send(formatLabelResponse(label));
    },
  );

  // Get all labels for a project
  app.get<{ Querystring: ListLabelsQuery }>(
    '/',
    {
      schema: {
        tags: ['Labels'],
        summary: 'Get all labels for a project',
        querystring: ListLabelsQuerySchema,
        response: {
          200: LabelListResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const useCase = container.resolve<ListLabelsUseCase>('listLabelsUseCase');
      const result = await useCase.execute({
        projectId: request.query.projectId,
        limit: request.query.limit,
        offset: request.query.offset,
      });
      return reply.send({
        data: result.data.map(formatLabelResponse),
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.hasMore,
      });
    },
  );

  // Get label by ID
  app.get<{ Params: IdParams }>(
    '/:id',
    {
      schema: {
        tags: ['Labels'],
        summary: 'Get a label by ID',
        params: IdParamsSchema,
        response: {
          200: LabelResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const useCase = container.resolve<GetLabelUseCase>('getLabelUseCase');
      const label = await useCase.execute({ id: request.params.id });
      return reply.send(formatLabelResponse(label));
    },
  );

  // Update label
  app.patch<{ Params: IdParams; Body: UpdateLabelBody }>(
    '/:id',
    {
      schema: {
        tags: ['Labels'],
        summary: 'Update a label',
        params: IdParamsSchema,
        body: UpdateLabelBodySchema,
        response: {
          200: LabelResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const useCase = container.resolve<UpdateLabelUseCase>('updateLabelUseCase');
      const label = await useCase.execute({
        id: request.params.id,
        ...request.body,
      });
      return reply.send(formatLabelResponse(label));
    },
  );

  // Delete label
  app.delete<{ Params: IdParams }>(
    '/:id',
    {
      schema: {
        tags: ['Labels'],
        summary: 'Delete a label',
        params: IdParamsSchema,
        response: {
          204: { type: 'null' },
        },
      },
    },
    async (request, reply) => {
      const useCase = container.resolve<DeleteLabelUseCase>('deleteLabelUseCase');
      await useCase.execute({ id: request.params.id });
      return reply.status(204).send();
    },
  );
}

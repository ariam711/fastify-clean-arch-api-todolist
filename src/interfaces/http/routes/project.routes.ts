import type {
  CreateProjectUseCase,
  DeleteProjectUseCase,
  GetProjectUseCase,
  ListProjectsUseCase,
  UpdateProjectUseCase,
} from '@app/use-cases/project/index.js';
import {
  type CreateProjectBody,
  CreateProjectBodySchema,
  type DeleteProjectQuery,
  DeleteProjectQuerySchema,
  type IdParams,
  IdParamsSchema,
  type PaginationQuery,
  PaginationQuerySchema,
  ProjectListResponseSchema,
  ProjectResponseSchema,
  type UpdateProjectBody,
  UpdateProjectBodySchema,
} from '@interface/http/dtos/project.dto.js';
import type { AwilixContainer } from 'awilix';
import type { FastifyInstance } from 'fastify';

function formatProjectResponse(project: {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

export async function projectRoutes(app: FastifyInstance): Promise<void> {
  const container = app.diContainer as AwilixContainer;

  // Create project
  app.post<{ Body: CreateProjectBody }>(
    '/',
    {
      schema: {
        tags: ['Projects'],
        summary: 'Create a new project',
        body: CreateProjectBodySchema,
        response: {
          201: ProjectResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const useCase = container.resolve<CreateProjectUseCase>('createProjectUseCase');
      const project = await useCase.execute(request.body);
      return reply.status(201).send(formatProjectResponse(project));
    },
  );

  // Get all projects
  app.get<{ Querystring: PaginationQuery }>(
    '/',
    {
      schema: {
        tags: ['Projects'],
        summary: 'Get all projects',
        querystring: PaginationQuerySchema,
        response: {
          200: ProjectListResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const useCase = container.resolve<ListProjectsUseCase>('listProjectsUseCase');
      const result = await useCase.execute({
        limit: request.query.limit,
        offset: request.query.offset,
      });
      return reply.send({
        data: result.data.map(formatProjectResponse),
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.hasMore,
      });
    },
  );

  // Get project by ID
  app.get<{ Params: IdParams }>(
    '/:id',
    {
      schema: {
        tags: ['Projects'],
        summary: 'Get a project by ID',
        params: IdParamsSchema,
        response: {
          200: ProjectResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const useCase = container.resolve<GetProjectUseCase>('getProjectUseCase');
      const project = await useCase.execute({ id: request.params.id });
      return reply.send(formatProjectResponse(project));
    },
  );

  // Update project
  app.patch<{ Params: IdParams; Body: UpdateProjectBody }>(
    '/:id',
    {
      schema: {
        tags: ['Projects'],
        summary: 'Update a project',
        params: IdParamsSchema,
        body: UpdateProjectBodySchema,
        response: {
          200: ProjectResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const useCase = container.resolve<UpdateProjectUseCase>('updateProjectUseCase');
      const project = await useCase.execute({
        id: request.params.id,
        ...request.body,
      });
      return reply.send(formatProjectResponse(project));
    },
  );

  // Delete project
  app.delete<{ Params: IdParams; Querystring: DeleteProjectQuery }>(
    '/:id',
    {
      schema: {
        tags: ['Projects'],
        summary: 'Delete a project',
        description: 'Use force=true to delete a project with open tasks',
        params: IdParamsSchema,
        querystring: DeleteProjectQuerySchema,
        response: {
          204: { type: 'null' },
        },
      },
    },
    async (request, reply) => {
      const useCase = container.resolve<DeleteProjectUseCase>('deleteProjectUseCase');
      await useCase.execute({
        id: request.params.id,
        force: request.query.force,
      });
      return reply.status(204).send();
    },
  );
}

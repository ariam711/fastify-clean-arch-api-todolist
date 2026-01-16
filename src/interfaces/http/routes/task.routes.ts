import type { AwilixContainer } from 'awilix';
import type { FastifyInstance } from 'fastify';
import type {
  CreateTaskUseCase,
  DeleteTaskUseCase,
  GetTaskUseCase,
  ListTasksUseCase,
  UpdateTaskUseCase,
} from '@app/use-cases/task/index.js';
import type { TaskPriority, TaskStatus } from '@domain/types/index.js';
import { type IdParams, IdParamsSchema } from '@interface/http/dtos/project.dto.js';
import {
  type CreateTaskBody,
  CreateTaskBodySchema,
  type ListTasksQuery,
  ListTasksQuerySchema,
  TaskListResponseSchema,
  TaskResponseSchema,
  type UpdateTaskBody,
  UpdateTaskBodySchema,
} from '@interface/http/dtos/task.dto.js';

function formatTaskResponse(task: {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  projectId: string;
  labelIds: string[];
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate?.toISOString(),
    projectId: task.projectId,
    labelIds: task.labelIds,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export async function taskRoutes(app: FastifyInstance): Promise<void> {
  const container = app.diContainer as AwilixContainer;

  // Create task
  app.post<{ Body: CreateTaskBody }>(
    '/',
    {
      schema: {
        tags: ['Tasks'],
        summary: 'Create a new task',
        body: CreateTaskBodySchema,
        response: {
          201: TaskResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const useCase = container.resolve<CreateTaskUseCase>('createTaskUseCase');
      const task = await useCase.execute({
        ...request.body,
        dueDate: request.body.dueDate ? new Date(request.body.dueDate) : undefined,
      });
      return reply.status(201).send(formatTaskResponse(task));
    },
  );

  // Get all tasks with filtering
  app.get<{ Querystring: ListTasksQuery }>(
    '/',
    {
      schema: {
        tags: ['Tasks'],
        summary: 'Get all tasks with filtering, pagination, and sorting',
        querystring: ListTasksQuerySchema,
        response: {
          200: TaskListResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const useCase = container.resolve<ListTasksUseCase>('listTasksUseCase');

      // Normalize labelIds to always be an array
      const labelIds = request.query.labelIds
        ? Array.isArray(request.query.labelIds)
          ? request.query.labelIds
          : [request.query.labelIds]
        : undefined;

      const result = await useCase.execute({
        projectId: request.query.projectId,
        status: request.query.status,
        priority: request.query.priority,
        labelIds,
        dueDateFrom: request.query.dueDateFrom ? new Date(request.query.dueDateFrom) : undefined,
        dueDateTo: request.query.dueDateTo ? new Date(request.query.dueDateTo) : undefined,
        search: request.query.search,
        limit: request.query.limit,
        cursor: request.query.cursor,
        sortField: request.query.sortField,
        sortOrder: request.query.sortOrder,
      });

      return reply.send({
        data: result.data.map(formatTaskResponse),
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      });
    },
  );

  // Get task by ID
  app.get<{ Params: IdParams }>(
    '/:id',
    {
      schema: {
        tags: ['Tasks'],
        summary: 'Get a task by ID',
        params: IdParamsSchema,
        response: {
          200: TaskResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const useCase = container.resolve<GetTaskUseCase>('getTaskUseCase');
      const task = await useCase.execute({ id: request.params.id });
      return reply.send(formatTaskResponse(task));
    },
  );

  // Update task
  app.patch<{ Params: IdParams; Body: UpdateTaskBody }>(
    '/:id',
    {
      schema: {
        tags: ['Tasks'],
        summary: 'Update a task',
        params: IdParamsSchema,
        body: UpdateTaskBodySchema,
        response: {
          200: TaskResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const useCase = container.resolve<UpdateTaskUseCase>('updateTaskUseCase');
      const task = await useCase.execute({
        id: request.params.id,
        title: request.body.title,
        description: request.body.description === null ? undefined : request.body.description,
        status: request.body.status,
        priority: request.body.priority,
        dueDate:
          request.body.dueDate === null ? null : request.body.dueDate ? new Date(request.body.dueDate) : undefined,
        labelIds: request.body.labelIds,
      });
      return reply.send(formatTaskResponse(task));
    },
  );

  // Delete task
  app.delete<{ Params: IdParams }>(
    '/:id',
    {
      schema: {
        tags: ['Tasks'],
        summary: 'Delete a task',
        params: IdParamsSchema,
        response: {
          204: { type: 'null' },
        },
      },
    },
    async (request, reply) => {
      const useCase = container.resolve<DeleteTaskUseCase>('deleteTaskUseCase');
      await useCase.execute({ id: request.params.id });
      return reply.status(204).send();
    },
  );
}

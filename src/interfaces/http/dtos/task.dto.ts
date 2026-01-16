import { type Static, Type } from '@sinclair/typebox';

const TaskStatusSchema = Type.Union([
  Type.Literal('todo'),
  Type.Literal('in_progress'),
  Type.Literal('done'),
  Type.Literal('cancelled'),
]);

const TaskPrioritySchema = Type.Union([
  Type.Literal('low'),
  Type.Literal('medium'),
  Type.Literal('high'),
  Type.Literal('urgent'),
]);

// Task DTOs
export const CreateTaskBodySchema = Type.Object({
  title: Type.String({ minLength: 1, maxLength: 200 }),
  description: Type.Optional(Type.String({ maxLength: 2000 })),
  status: Type.Optional(TaskStatusSchema),
  priority: Type.Optional(TaskPrioritySchema),
  dueDate: Type.Optional(Type.String({ format: 'date-time' })),
  projectId: Type.String({ minLength: 1 }),
  labelIds: Type.Optional(Type.Array(Type.String())),
});
export type CreateTaskBody = Static<typeof CreateTaskBodySchema>;

export const UpdateTaskBodySchema = Type.Object({
  title: Type.Optional(Type.String({ minLength: 1, maxLength: 200 })),
  description: Type.Optional(Type.Union([Type.String({ maxLength: 2000 }), Type.Null()])),
  status: Type.Optional(TaskStatusSchema),
  priority: Type.Optional(TaskPrioritySchema),
  dueDate: Type.Optional(Type.Union([Type.String({ format: 'date-time' }), Type.Null()])),
  labelIds: Type.Optional(Type.Array(Type.String())),
});
export type UpdateTaskBody = Static<typeof UpdateTaskBodySchema>;

export const ListTasksQuerySchema = Type.Object({
  projectId: Type.Optional(Type.String()),
  status: Type.Optional(Type.Union([TaskStatusSchema, Type.Array(TaskStatusSchema)])),
  priority: Type.Optional(Type.Union([TaskPrioritySchema, Type.Array(TaskPrioritySchema)])),
  labelIds: Type.Optional(Type.Union([Type.String(), Type.Array(Type.String())])),
  dueDateFrom: Type.Optional(Type.String({ format: 'date-time' })),
  dueDateTo: Type.Optional(Type.String({ format: 'date-time' })),
  search: Type.Optional(Type.String()),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
  cursor: Type.Optional(Type.String()),
  sortField: Type.Optional(Type.String()),
  sortOrder: Type.Optional(Type.Union([Type.Literal('asc'), Type.Literal('desc')])),
});
export type ListTasksQuery = Static<typeof ListTasksQuerySchema>;

export const TaskResponseSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  description: Type.Optional(Type.String()),
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  dueDate: Type.Optional(Type.String({ format: 'date-time' })),
  projectId: Type.String(),
  labelIds: Type.Array(Type.String()),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
});

export const TaskListResponseSchema = Type.Object({
  data: Type.Array(TaskResponseSchema),
  nextCursor: Type.Optional(Type.String()),
  hasMore: Type.Boolean(),
});

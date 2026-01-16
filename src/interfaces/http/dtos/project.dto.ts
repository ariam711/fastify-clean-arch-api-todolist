import { type Static, Type } from '@sinclair/typebox';

// Shared schemas
export const IdParamsSchema = Type.Object({
  id: Type.String({ minLength: 1 }),
});
export type IdParams = Static<typeof IdParamsSchema>;

export const PaginationQuerySchema = Type.Object({
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
  offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
});
export type PaginationQuery = Static<typeof PaginationQuerySchema>;

export const CursorPaginationQuerySchema = Type.Object({
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
  cursor: Type.Optional(Type.String()),
});
export type CursorPaginationQuery = Static<typeof CursorPaginationQuerySchema>;

// Project DTOs
export const CreateProjectBodySchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  description: Type.Optional(Type.String({ maxLength: 500 })),
});
export type CreateProjectBody = Static<typeof CreateProjectBodySchema>;

export const UpdateProjectBodySchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  description: Type.Optional(Type.String({ maxLength: 500 })),
});
export type UpdateProjectBody = Static<typeof UpdateProjectBodySchema>;

export const DeleteProjectQuerySchema = Type.Object({
  force: Type.Optional(Type.Boolean({ default: false })),
});
export type DeleteProjectQuery = Static<typeof DeleteProjectQuerySchema>;

export const ProjectResponseSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Type.Optional(Type.String()),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
});

export const ProjectListResponseSchema = Type.Object({
  data: Type.Array(ProjectResponseSchema),
  total: Type.Integer(),
  limit: Type.Integer(),
  offset: Type.Integer(),
  hasMore: Type.Boolean(),
});

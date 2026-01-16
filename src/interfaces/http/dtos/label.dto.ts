import { type Static, Type } from '@sinclair/typebox';

// Label DTOs
export const CreateLabelBodySchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 50 }),
  color: Type.Optional(Type.String({ pattern: '^#[0-9A-Fa-f]{6}$' })),
  projectId: Type.String({ minLength: 1 }),
});
export type CreateLabelBody = Static<typeof CreateLabelBodySchema>;

export const UpdateLabelBodySchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 50 })),
  color: Type.Optional(Type.String({ pattern: '^#[0-9A-Fa-f]{6}$' })),
});
export type UpdateLabelBody = Static<typeof UpdateLabelBodySchema>;

export const ListLabelsQuerySchema = Type.Object({
  projectId: Type.String({ minLength: 1 }),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 50 })),
  offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
});
export type ListLabelsQuery = Static<typeof ListLabelsQuerySchema>;

export const LabelResponseSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  color: Type.String(),
  projectId: Type.String(),
  createdAt: Type.String({ format: 'date-time' }),
});

export const LabelListResponseSchema = Type.Object({
  data: Type.Array(LabelResponseSchema),
  total: Type.Integer(),
  limit: Type.Integer(),
  offset: Type.Integer(),
  hasMore: Type.Boolean(),
});

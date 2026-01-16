export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done', 'cancelled'];

export const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

export interface PaginationParams {
  limit: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
  total?: number;
}

export interface OffsetPaginationParams {
  limit: number;
  offset: number;
}

export interface OffsetPaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

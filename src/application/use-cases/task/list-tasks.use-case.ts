import type { Task } from '@domain/entities/task.entity.js';
import type { PaginatedResult, SortParams, TaskPriority, TaskStatus } from '@domain/types/index.js';
import type { TaskFilterParams, TaskRepositoryPort } from '@app/ports/task.repository.port.js';

export interface ListTasksQuery {
  projectId?: string;
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  labelIds?: string[];
  dueDateFrom?: Date;
  dueDateTo?: Date;
  search?: string;
  limit?: number;
  cursor?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ListTasksUseCase {
  constructor(private readonly taskRepository: TaskRepositoryPort) {}

  async execute(query: ListTasksQuery): Promise<PaginatedResult<Task>> {
    const filter: TaskFilterParams = {
      projectId: query.projectId,
      status: query.status,
      priority: query.priority,
      labelIds: query.labelIds,
      dueDateFrom: query.dueDateFrom,
      dueDateTo: query.dueDateTo,
      search: query.search,
    };

    const sort: SortParams | undefined = query.sortField
      ? { field: query.sortField, order: query.sortOrder ?? 'asc' }
      : undefined;

    return this.taskRepository.findAll({
      filter,
      pagination: {
        limit: query.limit ?? 20,
        cursor: query.cursor,
      },
      sort,
    });
  }
}

import type { Task } from '@domain/entities/task.entity.js';
import type {
  PaginatedResult,
  PaginationParams,
  SortParams,
  TaskPriority,
  TaskStatus,
} from '@domain/types/index.js';

export interface TaskFilterParams {
  projectId?: string;
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  labelIds?: string[];
  dueDateFrom?: Date;
  dueDateTo?: Date;
  search?: string;
}

export interface ListTasksParams {
  filter?: TaskFilterParams;
  pagination: PaginationParams;
  sort?: SortParams;
}

export interface TaskRepositoryPort {
  create(task: Task): Promise<Task>;
  findById(id: string): Promise<Task | null>;
  findByProjectId(projectId: string): Promise<Task[]>;
  findAll(params: ListTasksParams): Promise<PaginatedResult<Task>>;
  update(task: Task): Promise<Task>;
  delete(id: string): Promise<void>;
  deleteByProjectId(projectId: string): Promise<number>;
  countOpenTasksByProjectId(projectId: string): Promise<number>;
}

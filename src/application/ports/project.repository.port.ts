import type { Project } from '../../domain/entities/project.entity.js';
import type { OffsetPaginatedResult, OffsetPaginationParams } from '../../domain/types/index.js';

export interface ProjectRepositoryPort {
  create(project: Project): Promise<Project>;
  findById(id: string): Promise<Project | null>;
  findByName(name: string): Promise<Project | null>;
  findAll(pagination: OffsetPaginationParams): Promise<OffsetPaginatedResult<Project>>;
  update(project: Project): Promise<Project>;
  delete(id: string): Promise<void>;
  hasOpenTasks(projectId: string): Promise<boolean>;
}

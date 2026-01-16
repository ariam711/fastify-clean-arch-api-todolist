import type { ProjectRepositoryPort } from '@app/ports/project.repository.port.js';
import type { Project } from '@domain/entities/project.entity.js';
import type { OffsetPaginatedResult } from '@domain/types/index.js';

export interface ListProjectsQuery {
  limit?: number;
  offset?: number;
}

export class ListProjectsUseCase {
  constructor(private readonly projectRepository: ProjectRepositoryPort) {}

  async execute(query: ListProjectsQuery): Promise<OffsetPaginatedResult<Project>> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    return this.projectRepository.findAll({ limit, offset });
  }
}

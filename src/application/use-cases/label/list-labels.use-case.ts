import type { LabelRepositoryPort } from '@app/ports/label.repository.port.js';
import type { ProjectRepositoryPort } from '@app/ports/project.repository.port.js';
import type { Label } from '@domain/entities/label.entity.js';
import { NotFoundError } from '@domain/errors/domain-errors.js';
import type { OffsetPaginatedResult } from '@domain/types/index.js';

export interface ListLabelsQuery {
  projectId: string;
  limit?: number;
  offset?: number;
}

export class ListLabelsUseCase {
  constructor(
    private readonly labelRepository: LabelRepositoryPort,
    private readonly projectRepository: ProjectRepositoryPort,
  ) {}

  async execute(query: ListLabelsQuery): Promise<OffsetPaginatedResult<Label>> {
    // Verify project exists
    const project = await this.projectRepository.findById(query.projectId);
    if (!project) {
      throw new NotFoundError('Project', query.projectId);
    }

    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;

    return this.labelRepository.findByProjectId(query.projectId, { limit, offset });
  }
}

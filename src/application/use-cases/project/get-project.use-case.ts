import type { Project } from '@domain/entities/project.entity.js';
import { NotFoundError } from '@domain/errors/domain-errors.js';
import type { ProjectRepositoryPort } from '@app/ports/project.repository.port.js';

export interface GetProjectQuery {
  id: string;
}

export class GetProjectUseCase {
  constructor(private readonly projectRepository: ProjectRepositoryPort) {}

  async execute(query: GetProjectQuery): Promise<Project> {
    const project = await this.projectRepository.findById(query.id);

    if (!project) {
      throw new NotFoundError('Project', query.id);
    }

    return project;
  }
}

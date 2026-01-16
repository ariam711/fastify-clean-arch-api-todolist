import { Project } from '../../../domain/entities/project.entity.js';
import { ConflictError } from '../../../domain/errors/domain-errors.js';
import type { ProjectRepositoryPort } from '../../ports/project.repository.port.js';

export interface CreateProjectCommand {
  name: string;
  description?: string;
}

export class CreateProjectUseCase {
  constructor(private readonly projectRepository: ProjectRepositoryPort) {}

  async execute(command: CreateProjectCommand): Promise<Project> {
    const existingProject = await this.projectRepository.findByName(command.name.trim());

    if (existingProject) {
      throw new ConflictError('Project', 'name');
    }

    const project = Project.create({
      name: command.name,
      description: command.description,
    });

    return this.projectRepository.create(project);
  }
}

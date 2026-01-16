import type { Project } from '@domain/entities/project.entity.js';
import { ConflictError, NotFoundError } from '@domain/errors/domain-errors.js';
import type { ProjectRepositoryPort } from '@app/ports/project.repository.port.js';

export interface UpdateProjectCommand {
  id: string;
  name?: string;
  description?: string;
}

export class UpdateProjectUseCase {
  constructor(private readonly projectRepository: ProjectRepositoryPort) {}

  async execute(command: UpdateProjectCommand): Promise<Project> {
    const project = await this.projectRepository.findById(command.id);

    if (!project) {
      throw new NotFoundError('Project', command.id);
    }

    if (command.name && command.name.trim() !== project.name) {
      const existingProject = await this.projectRepository.findByName(command.name.trim());
      if (existingProject && existingProject.id !== project.id) {
        throw new ConflictError('Project', 'name');
      }
    }

    project.update({
      name: command.name,
      description: command.description,
    });

    return this.projectRepository.update(project);
  }
}

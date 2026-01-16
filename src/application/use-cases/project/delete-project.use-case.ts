import type { LabelRepositoryPort } from '@app/ports/label.repository.port.js';
import type { ProjectRepositoryPort } from '@app/ports/project.repository.port.js';
import type { TaskRepositoryPort } from '@app/ports/task.repository.port.js';
import { BusinessRuleViolationError, NotFoundError } from '@domain/errors/domain-errors.js';

export interface DeleteProjectCommand {
  id: string;
  force?: boolean;
}

export class DeleteProjectUseCase {
  constructor(
    private readonly projectRepository: ProjectRepositoryPort,
    private readonly taskRepository: TaskRepositoryPort,
    private readonly labelRepository: LabelRepositoryPort,
  ) {}

  async execute(command: DeleteProjectCommand): Promise<void> {
    const project = await this.projectRepository.findById(command.id);

    if (!project) {
      throw new NotFoundError('Project', command.id);
    }

    const openTaskCount = await this.taskRepository.countOpenTasksByProjectId(command.id);

    if (openTaskCount > 0 && !command.force) {
      throw new BusinessRuleViolationError(
        'PROJECT_HAS_OPEN_TASKS',
        `Cannot delete project with ${openTaskCount} open task(s). Use force=true to delete anyway.`,
      );
    }

    // Delete all related tasks and labels when force deleting
    await this.taskRepository.deleteByProjectId(command.id);
    await this.labelRepository.deleteByProjectId(command.id);
    await this.projectRepository.delete(command.id);
  }
}

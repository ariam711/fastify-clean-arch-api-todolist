import type { LabelRepositoryPort } from '@app/ports/label.repository.port.js';
import type { ProjectRepositoryPort } from '@app/ports/project.repository.port.js';
import type { TaskRepositoryPort } from '@app/ports/task.repository.port.js';
import { Task } from '@domain/entities/task.entity.js';
import { NotFoundError } from '@domain/errors/domain-errors.js';
import type { TaskPriority, TaskStatus } from '@domain/types/index.js';

export interface CreateTaskCommand {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
  projectId: string;
  labelIds?: string[];
}

export class CreateTaskUseCase {
  constructor(
    private readonly taskRepository: TaskRepositoryPort,
    private readonly projectRepository: ProjectRepositoryPort,
    private readonly labelRepository: LabelRepositoryPort,
  ) {}

  async execute(command: CreateTaskCommand): Promise<Task> {
    // Verify project exists
    const project = await this.projectRepository.findById(command.projectId);
    if (!project) {
      throw new NotFoundError('Project', command.projectId);
    }

    // Verify labels exist and belong to the same project
    if (command.labelIds && command.labelIds.length > 0) {
      const labels = await this.labelRepository.findByIds(command.labelIds);
      const foundIds = new Set(labels.map((l) => l.id));
      const missingIds = command.labelIds.filter((id) => !foundIds.has(id));

      if (missingIds.length > 0) {
        throw new NotFoundError('Label', missingIds.join(', '));
      }

      const invalidLabels = labels.filter((l) => l.projectId !== command.projectId);
      if (invalidLabels.length > 0) {
        throw new NotFoundError(
          'Label',
          `Labels ${invalidLabels.map((l) => l.id).join(', ')} do not belong to this project`,
        );
      }
    }

    const task = Task.create({
      title: command.title,
      description: command.description,
      status: command.status,
      priority: command.priority,
      dueDate: command.dueDate,
      projectId: command.projectId,
      labelIds: command.labelIds,
    });

    return this.taskRepository.create(task);
  }
}

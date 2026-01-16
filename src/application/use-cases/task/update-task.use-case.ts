import type { Task } from '../../../domain/entities/task.entity.js';
import { NotFoundError } from '../../../domain/errors/domain-errors.js';
import type { TaskPriority, TaskStatus } from '../../../domain/types/index.js';
import type { LabelRepositoryPort } from '../../ports/label.repository.port.js';
import type { TaskRepositoryPort } from '../../ports/task.repository.port.js';

export interface UpdateTaskCommand {
  id: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
  labelIds?: string[];
}

export class UpdateTaskUseCase {
  constructor(
    private readonly taskRepository: TaskRepositoryPort,
    private readonly labelRepository: LabelRepositoryPort,
  ) {}

  async execute(command: UpdateTaskCommand): Promise<Task> {
    const task = await this.taskRepository.findById(command.id);

    if (!task) {
      throw new NotFoundError('Task', command.id);
    }

    // Verify labels exist and belong to the same project
    if (command.labelIds && command.labelIds.length > 0) {
      const labels = await this.labelRepository.findByIds(command.labelIds);
      const foundIds = new Set(labels.map((l) => l.id));
      const missingIds = command.labelIds.filter((id) => !foundIds.has(id));

      if (missingIds.length > 0) {
        throw new NotFoundError('Label', missingIds.join(', '));
      }

      const invalidLabels = labels.filter((l) => l.projectId !== task.projectId);
      if (invalidLabels.length > 0) {
        throw new NotFoundError(
          'Label',
          `Labels ${invalidLabels.map((l) => l.id).join(', ')} do not belong to this project`,
        );
      }
    }

    task.update({
      title: command.title,
      description: command.description,
      status: command.status,
      priority: command.priority,
      dueDate: command.dueDate,
      labelIds: command.labelIds,
    });

    return this.taskRepository.update(task);
  }
}

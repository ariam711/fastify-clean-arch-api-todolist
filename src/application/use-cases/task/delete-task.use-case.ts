import { NotFoundError } from '../../../domain/errors/domain-errors.js';
import type { TaskRepositoryPort } from '../../ports/task.repository.port.js';

export interface DeleteTaskCommand {
  id: string;
}

export class DeleteTaskUseCase {
  constructor(private readonly taskRepository: TaskRepositoryPort) {}

  async execute(command: DeleteTaskCommand): Promise<void> {
    const task = await this.taskRepository.findById(command.id);

    if (!task) {
      throw new NotFoundError('Task', command.id);
    }

    await this.taskRepository.delete(command.id);
  }
}

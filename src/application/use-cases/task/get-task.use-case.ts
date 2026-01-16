import type { Task } from '@domain/entities/task.entity.js';
import { NotFoundError } from '@domain/errors/domain-errors.js';
import type { TaskRepositoryPort } from '@app/ports/task.repository.port.js';

export interface GetTaskQuery {
  id: string;
}

export class GetTaskUseCase {
  constructor(private readonly taskRepository: TaskRepositoryPort) {}

  async execute(query: GetTaskQuery): Promise<Task> {
    const task = await this.taskRepository.findById(query.id);

    if (!task) {
      throw new NotFoundError('Task', query.id);
    }

    return task;
  }
}

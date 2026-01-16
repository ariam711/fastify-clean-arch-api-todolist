import { NotFoundError } from '@domain/errors/domain-errors.js';
import type { LabelRepositoryPort } from '@app/ports/label.repository.port.js';

export interface DeleteLabelCommand {
  id: string;
}

export class DeleteLabelUseCase {
  constructor(private readonly labelRepository: LabelRepositoryPort) {}

  async execute(command: DeleteLabelCommand): Promise<void> {
    const label = await this.labelRepository.findById(command.id);

    if (!label) {
      throw new NotFoundError('Label', command.id);
    }

    await this.labelRepository.delete(command.id);
  }
}

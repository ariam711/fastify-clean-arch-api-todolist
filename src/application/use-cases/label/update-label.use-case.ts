import type { Label } from '../../../domain/entities/label.entity.js';
import { ConflictError, NotFoundError } from '../../../domain/errors/domain-errors.js';
import type { LabelRepositoryPort } from '../../ports/label.repository.port.js';

export interface UpdateLabelCommand {
  id: string;
  name?: string;
  color?: string;
}

export class UpdateLabelUseCase {
  constructor(private readonly labelRepository: LabelRepositoryPort) {}

  async execute(command: UpdateLabelCommand): Promise<Label> {
    const label = await this.labelRepository.findById(command.id);

    if (!label) {
      throw new NotFoundError('Label', command.id);
    }

    // Check for duplicate label name within the project
    if (command.name && command.name.trim() !== label.name) {
      const existingLabel = await this.labelRepository.findByName(
        command.name.trim(),
        label.projectId,
      );
      if (existingLabel && existingLabel.id !== label.id) {
        throw new ConflictError(
          'Label',
          'name',
          'A label with this name already exists in this project',
        );
      }
    }

    label.update({
      name: command.name,
      color: command.color,
    });

    return this.labelRepository.update(label);
  }
}

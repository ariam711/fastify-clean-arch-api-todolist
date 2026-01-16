import type { LabelRepositoryPort } from '@app/ports/label.repository.port.js';
import type { Label } from '@domain/entities/label.entity.js';
import { NotFoundError } from '@domain/errors/domain-errors.js';

export interface GetLabelQuery {
  id: string;
}

export class GetLabelUseCase {
  constructor(private readonly labelRepository: LabelRepositoryPort) {}

  async execute(query: GetLabelQuery): Promise<Label> {
    const label = await this.labelRepository.findById(query.id);

    if (!label) {
      throw new NotFoundError('Label', query.id);
    }

    return label;
  }
}

import { Label } from '@domain/entities/label.entity.js';
import { ConflictError, NotFoundError } from '@domain/errors/domain-errors.js';
import type { LabelRepositoryPort } from '@app/ports/label.repository.port.js';
import type { ProjectRepositoryPort } from '@app/ports/project.repository.port.js';

export interface CreateLabelCommand {
  name: string;
  color?: string;
  projectId: string;
}

export class CreateLabelUseCase {
  constructor(
    private readonly labelRepository: LabelRepositoryPort,
    private readonly projectRepository: ProjectRepositoryPort,
  ) {}

  async execute(command: CreateLabelCommand): Promise<Label> {
    // Verify project exists
    const project = await this.projectRepository.findById(command.projectId);
    if (!project) {
      throw new NotFoundError('Project', command.projectId);
    }

    // Check for duplicate label name within the project
    const existingLabel = await this.labelRepository.findByName(command.name.trim(), command.projectId);
    if (existingLabel) {
      throw new ConflictError('Label', 'name', 'A label with this name already exists in this project');
    }

    const label = Label.create({
      name: command.name,
      color: command.color,
      projectId: command.projectId,
    });

    return this.labelRepository.create(label);
  }
}

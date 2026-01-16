import type { LabelRepositoryPort } from '@app/ports/label.repository.port.js';
import type { ProjectRepositoryPort } from '@app/ports/project.repository.port.js';
import { CreateLabelUseCase } from '@app/use-cases/label/create-label.use-case.js';
import { DeleteLabelUseCase } from '@app/use-cases/label/delete-label.use-case.js';
import { GetLabelUseCase } from '@app/use-cases/label/get-label.use-case.js';
import { ListLabelsUseCase } from '@app/use-cases/label/list-labels.use-case.js';
import { UpdateLabelUseCase } from '@app/use-cases/label/update-label.use-case.js';
import { ConflictError, NotFoundError } from '@domain/errors/domain-errors.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLabel, createProject } from '../../helpers/test-builders.js';

const createMockLabelRepository = (): LabelRepositoryPort => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByIds: vi.fn(),
  findByName: vi.fn(),
  findByProjectId: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  deleteByProjectId: vi.fn(),
});

const createMockProjectRepository = (): ProjectRepositoryPort => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByName: vi.fn(),
  findAll: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  hasOpenTasks: vi.fn(),
});

describe('Label Use Cases', () => {
  let labelRepository: LabelRepositoryPort;
  let projectRepository: ProjectRepositoryPort;

  beforeEach(() => {
    labelRepository = createMockLabelRepository();
    projectRepository = createMockProjectRepository();
  });

  describe('CreateLabelUseCase', () => {
    it('should create a label successfully', async () => {
      const project = createProject({ name: 'Test' }, 'proj-1');
      vi.mocked(projectRepository.findById).mockResolvedValue(project);
      vi.mocked(labelRepository.findByName).mockResolvedValue(null);
      vi.mocked(labelRepository.create).mockImplementation(async (l) => l);

      const useCase = new CreateLabelUseCase(labelRepository, projectRepository);
      const result = await useCase.execute({
        name: 'Bug',
        color: '#ef4444',
        projectId: 'proj-1',
      });

      expect(result.name).toBe('Bug');
      expect(result.color).toBe('#ef4444');
      expect(result.projectId).toBe('proj-1');
    });

    it('should throw NotFoundError when project does not exist', async () => {
      vi.mocked(projectRepository.findById).mockResolvedValue(null);

      const useCase = new CreateLabelUseCase(labelRepository, projectRepository);

      await expect(useCase.execute({ name: 'Bug', projectId: 'non-existent' })).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when label name already exists in project', async () => {
      const project = createProject({ name: 'Test' }, 'proj-1');
      const existingLabel = createLabel({ name: 'Bug', projectId: 'proj-1' }, 'label-1');
      vi.mocked(projectRepository.findById).mockResolvedValue(project);
      vi.mocked(labelRepository.findByName).mockResolvedValue(existingLabel);

      const useCase = new CreateLabelUseCase(labelRepository, projectRepository);

      await expect(useCase.execute({ name: 'Bug', projectId: 'proj-1' })).rejects.toThrow(ConflictError);
    });
  });

  describe('GetLabelUseCase', () => {
    it('should return label when found', async () => {
      const label = createLabel({ name: 'Bug' }, 'label-1');
      vi.mocked(labelRepository.findById).mockResolvedValue(label);

      const useCase = new GetLabelUseCase(labelRepository);
      const result = await useCase.execute({ id: 'label-1' });

      expect(result.id).toBe('label-1');
      expect(result.name).toBe('Bug');
    });

    it('should throw NotFoundError when label not found', async () => {
      vi.mocked(labelRepository.findById).mockResolvedValue(null);

      const useCase = new GetLabelUseCase(labelRepository);

      await expect(useCase.execute({ id: 'non-existent' })).rejects.toThrow(NotFoundError);
    });
  });

  describe('UpdateLabelUseCase', () => {
    it('should update label successfully', async () => {
      const label = createLabel({ name: 'Original', projectId: 'proj-1' }, 'label-1');
      vi.mocked(labelRepository.findById).mockResolvedValue(label);
      vi.mocked(labelRepository.findByName).mockResolvedValue(null);
      vi.mocked(labelRepository.update).mockImplementation(async (l) => l);

      const useCase = new UpdateLabelUseCase(labelRepository);
      const result = await useCase.execute({ id: 'label-1', name: 'Updated' });

      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundError when label not found', async () => {
      vi.mocked(labelRepository.findById).mockResolvedValue(null);

      const useCase = new UpdateLabelUseCase(labelRepository);

      await expect(useCase.execute({ id: 'non-existent', name: 'New' })).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when new name already exists', async () => {
      const label = createLabel({ name: 'Original', projectId: 'proj-1' }, 'label-1');
      const existingLabel = createLabel({ name: 'Existing', projectId: 'proj-1' }, 'label-2');
      vi.mocked(labelRepository.findById).mockResolvedValue(label);
      vi.mocked(labelRepository.findByName).mockResolvedValue(existingLabel);

      const useCase = new UpdateLabelUseCase(labelRepository);

      await expect(useCase.execute({ id: 'label-1', name: 'Existing' })).rejects.toThrow(ConflictError);
    });

    it('should allow updating to same name', async () => {
      const label = createLabel({ name: 'Bug', projectId: 'proj-1' }, 'label-1');
      vi.mocked(labelRepository.findById).mockResolvedValue(label);
      vi.mocked(labelRepository.findByName).mockResolvedValue(label); // Same label
      vi.mocked(labelRepository.update).mockImplementation(async (l) => l);

      const useCase = new UpdateLabelUseCase(labelRepository);
      const result = await useCase.execute({ id: 'label-1', name: 'Bug', color: '#000000' });

      expect(result.color).toBe('#000000');
    });
  });

  describe('DeleteLabelUseCase', () => {
    it('should delete label successfully', async () => {
      const label = createLabel({ name: 'Bug' }, 'label-1');
      vi.mocked(labelRepository.findById).mockResolvedValue(label);
      vi.mocked(labelRepository.delete).mockResolvedValue(undefined);

      const useCase = new DeleteLabelUseCase(labelRepository);
      await useCase.execute({ id: 'label-1' });

      expect(labelRepository.delete).toHaveBeenCalledWith('label-1');
    });

    it('should throw NotFoundError when label not found', async () => {
      vi.mocked(labelRepository.findById).mockResolvedValue(null);

      const useCase = new DeleteLabelUseCase(labelRepository);

      await expect(useCase.execute({ id: 'non-existent' })).rejects.toThrow(NotFoundError);
    });
  });

  describe('ListLabelsUseCase', () => {
    it('should return paginated labels for project', async () => {
      const project = createProject({ name: 'Test' }, 'proj-1');
      const labels = [
        createLabel({ name: 'Bug', projectId: 'proj-1' }),
        createLabel({ name: 'Feature', projectId: 'proj-1' }),
      ];
      vi.mocked(projectRepository.findById).mockResolvedValue(project);
      vi.mocked(labelRepository.findByProjectId).mockResolvedValue({
        data: labels,
        total: 2,
        limit: 50,
        offset: 0,
        hasMore: false,
      });

      const useCase = new ListLabelsUseCase(labelRepository, projectRepository);
      const result = await useCase.execute({ projectId: 'proj-1' });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should throw NotFoundError when project does not exist', async () => {
      vi.mocked(projectRepository.findById).mockResolvedValue(null);

      const useCase = new ListLabelsUseCase(labelRepository, projectRepository);

      await expect(useCase.execute({ projectId: 'non-existent' })).rejects.toThrow(NotFoundError);
    });

    it('should use default pagination values', async () => {
      const project = createProject({ name: 'Test' }, 'proj-1');
      vi.mocked(projectRepository.findById).mockResolvedValue(project);
      vi.mocked(labelRepository.findByProjectId).mockResolvedValue({
        data: [],
        total: 0,
        limit: 50,
        offset: 0,
        hasMore: false,
      });

      const useCase = new ListLabelsUseCase(labelRepository, projectRepository);
      await useCase.execute({ projectId: 'proj-1' });

      expect(labelRepository.findByProjectId).toHaveBeenCalledWith('proj-1', {
        limit: 50,
        offset: 0,
      });
    });

    it('should respect custom pagination', async () => {
      const project = createProject({ name: 'Test' }, 'proj-1');
      vi.mocked(projectRepository.findById).mockResolvedValue(project);
      vi.mocked(labelRepository.findByProjectId).mockResolvedValue({
        data: [],
        total: 0,
        limit: 10,
        offset: 5,
        hasMore: false,
      });

      const useCase = new ListLabelsUseCase(labelRepository, projectRepository);
      await useCase.execute({ projectId: 'proj-1', limit: 10, offset: 5 });

      expect(labelRepository.findByProjectId).toHaveBeenCalledWith('proj-1', {
        limit: 10,
        offset: 5,
      });
    });
  });
});

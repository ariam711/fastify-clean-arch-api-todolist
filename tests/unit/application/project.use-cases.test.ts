import type { LabelRepositoryPort } from '@app/ports/label.repository.port.js';
import type { ProjectRepositoryPort } from '@app/ports/project.repository.port.js';
import type { TaskRepositoryPort } from '@app/ports/task.repository.port.js';
import { CreateProjectUseCase } from '@app/use-cases/project/create-project.use-case.js';
import { DeleteProjectUseCase } from '@app/use-cases/project/delete-project.use-case.js';
import { GetProjectUseCase } from '@app/use-cases/project/get-project.use-case.js';
import { ListProjectsUseCase } from '@app/use-cases/project/list-projects.use-case.js';
import { UpdateProjectUseCase } from '@app/use-cases/project/update-project.use-case.js';
import { BusinessRuleViolationError, ConflictError, NotFoundError } from '@domain/errors/domain-errors.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProject } from '../../helpers/test-builders.js';

const createMockProjectRepository = (): ProjectRepositoryPort => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByName: vi.fn(),
  findAll: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  hasOpenTasks: vi.fn(),
});

const createMockTaskRepository = (): TaskRepositoryPort => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByProjectId: vi.fn(),
  findAll: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  deleteByProjectId: vi.fn(),
  countOpenTasksByProjectId: vi.fn(),
});

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

describe('Project Use Cases', () => {
  let projectRepository: ProjectRepositoryPort;
  let taskRepository: TaskRepositoryPort;
  let labelRepository: LabelRepositoryPort;

  beforeEach(() => {
    projectRepository = createMockProjectRepository();
    taskRepository = createMockTaskRepository();
    labelRepository = createMockLabelRepository();
  });

  describe('CreateProjectUseCase', () => {
    it('should create a project successfully', async () => {
      vi.mocked(projectRepository.findByName).mockResolvedValue(null);
      vi.mocked(projectRepository.create).mockImplementation(async (p) => p);

      const useCase = new CreateProjectUseCase(projectRepository);
      const result = await useCase.execute({ name: 'New Project' });

      expect(result.name).toBe('New Project');
      expect(projectRepository.create).toHaveBeenCalled();
    });

    it('should throw ConflictError when project name already exists', async () => {
      const existingProject = createProject({ name: 'Existing' });
      vi.mocked(projectRepository.findByName).mockResolvedValue(existingProject);

      const useCase = new CreateProjectUseCase(projectRepository);

      await expect(useCase.execute({ name: 'Existing' })).rejects.toThrow(ConflictError);
    });
  });

  describe('GetProjectUseCase', () => {
    it('should return project when found', async () => {
      const project = createProject({ name: 'Test' }, 'proj-1');
      vi.mocked(projectRepository.findById).mockResolvedValue(project);

      const useCase = new GetProjectUseCase(projectRepository);
      const result = await useCase.execute({ id: 'proj-1' });

      expect(result.id).toBe('proj-1');
      expect(result.name).toBe('Test');
    });

    it('should throw NotFoundError when project not found', async () => {
      vi.mocked(projectRepository.findById).mockResolvedValue(null);

      const useCase = new GetProjectUseCase(projectRepository);

      await expect(useCase.execute({ id: 'non-existent' })).rejects.toThrow(NotFoundError);
    });
  });

  describe('UpdateProjectUseCase', () => {
    it('should update project successfully', async () => {
      const project = createProject({ name: 'Original' }, 'proj-1');
      vi.mocked(projectRepository.findById).mockResolvedValue(project);
      vi.mocked(projectRepository.findByName).mockResolvedValue(null);
      vi.mocked(projectRepository.update).mockImplementation(async (p) => p);

      const useCase = new UpdateProjectUseCase(projectRepository);
      const result = await useCase.execute({ id: 'proj-1', name: 'Updated' });

      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundError when project not found', async () => {
      vi.mocked(projectRepository.findById).mockResolvedValue(null);

      const useCase = new UpdateProjectUseCase(projectRepository);

      await expect(useCase.execute({ id: 'non-existent', name: 'New' })).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when new name already exists', async () => {
      const project = createProject({ name: 'Original' }, 'proj-1');
      const existingProject = createProject({ name: 'Existing' }, 'proj-2');
      vi.mocked(projectRepository.findById).mockResolvedValue(project);
      vi.mocked(projectRepository.findByName).mockResolvedValue(existingProject);

      const useCase = new UpdateProjectUseCase(projectRepository);

      await expect(useCase.execute({ id: 'proj-1', name: 'Existing' })).rejects.toThrow(ConflictError);
    });
  });

  describe('DeleteProjectUseCase', () => {
    it('should delete project without open tasks', async () => {
      const project = createProject({ name: 'Test' }, 'proj-1');
      vi.mocked(projectRepository.findById).mockResolvedValue(project);
      vi.mocked(taskRepository.countOpenTasksByProjectId).mockResolvedValue(0);
      vi.mocked(taskRepository.deleteByProjectId).mockResolvedValue(0);
      vi.mocked(labelRepository.deleteByProjectId).mockResolvedValue(0);
      vi.mocked(projectRepository.delete).mockResolvedValue(undefined);

      const useCase = new DeleteProjectUseCase(projectRepository, taskRepository, labelRepository);
      await useCase.execute({ id: 'proj-1' });

      expect(projectRepository.delete).toHaveBeenCalledWith('proj-1');
    });

    it('should throw BusinessRuleViolationError when project has open tasks without force', async () => {
      const project = createProject({ name: 'Test' }, 'proj-1');
      vi.mocked(projectRepository.findById).mockResolvedValue(project);
      vi.mocked(taskRepository.countOpenTasksByProjectId).mockResolvedValue(5);

      const useCase = new DeleteProjectUseCase(projectRepository, taskRepository, labelRepository);

      await expect(useCase.execute({ id: 'proj-1' })).rejects.toThrow(BusinessRuleViolationError);
    });

    it('should delete project with open tasks when force is true', async () => {
      const project = createProject({ name: 'Test' }, 'proj-1');
      vi.mocked(projectRepository.findById).mockResolvedValue(project);
      vi.mocked(taskRepository.countOpenTasksByProjectId).mockResolvedValue(5);
      vi.mocked(taskRepository.deleteByProjectId).mockResolvedValue(5);
      vi.mocked(labelRepository.deleteByProjectId).mockResolvedValue(2);
      vi.mocked(projectRepository.delete).mockResolvedValue(undefined);

      const useCase = new DeleteProjectUseCase(projectRepository, taskRepository, labelRepository);
      await useCase.execute({ id: 'proj-1', force: true });

      expect(taskRepository.deleteByProjectId).toHaveBeenCalledWith('proj-1');
      expect(labelRepository.deleteByProjectId).toHaveBeenCalledWith('proj-1');
      expect(projectRepository.delete).toHaveBeenCalledWith('proj-1');
    });
  });

  describe('ListProjectsUseCase', () => {
    it('should return paginated projects', async () => {
      const projects = [createProject({ name: 'Project 1' }), createProject({ name: 'Project 2' })];
      vi.mocked(projectRepository.findAll).mockResolvedValue({
        data: projects,
        total: 2,
        limit: 20,
        offset: 0,
        hasMore: false,
      });

      const useCase = new ListProjectsUseCase(projectRepository);
      const result = await useCase.execute({});

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });
});

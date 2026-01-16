import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LabelRepositoryPort } from '../../../src/application/ports/label.repository.port.js';
import type { ProjectRepositoryPort } from '../../../src/application/ports/project.repository.port.js';
import type { TaskRepositoryPort } from '../../../src/application/ports/task.repository.port.js';
import { CreateTaskUseCase } from '../../../src/application/use-cases/task/create-task.use-case.js';
import { DeleteTaskUseCase } from '../../../src/application/use-cases/task/delete-task.use-case.js';
import { GetTaskUseCase } from '../../../src/application/use-cases/task/get-task.use-case.js';
import { ListTasksUseCase } from '../../../src/application/use-cases/task/list-tasks.use-case.js';
import { UpdateTaskUseCase } from '../../../src/application/use-cases/task/update-task.use-case.js';
import { NotFoundError } from '../../../src/domain/errors/domain-errors.js';
import { createLabel, createProject, createTask } from '../../helpers/test-builders.js';

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

const createMockProjectRepository = (): ProjectRepositoryPort => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByName: vi.fn(),
  findAll: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  hasOpenTasks: vi.fn(),
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

describe('Task Use Cases', () => {
  let taskRepository: TaskRepositoryPort;
  let projectRepository: ProjectRepositoryPort;
  let labelRepository: LabelRepositoryPort;

  beforeEach(() => {
    taskRepository = createMockTaskRepository();
    projectRepository = createMockProjectRepository();
    labelRepository = createMockLabelRepository();
  });

  describe('CreateTaskUseCase', () => {
    it('should create a task successfully', async () => {
      const project = createProject({ name: 'Test Project' }, 'proj-1');
      vi.mocked(projectRepository.findById).mockResolvedValue(project);
      vi.mocked(labelRepository.findByIds).mockResolvedValue([]);
      vi.mocked(taskRepository.create).mockImplementation(async (t) => t);

      const useCase = new CreateTaskUseCase(taskRepository, projectRepository, labelRepository);
      const result = await useCase.execute({
        title: 'New Task',
        projectId: 'proj-1',
      });

      expect(result.title).toBe('New Task');
      expect(result.projectId).toBe('proj-1');
      expect(result.status).toBe('todo');
    });

    it('should throw NotFoundError when project does not exist', async () => {
      vi.mocked(projectRepository.findById).mockResolvedValue(null);

      const useCase = new CreateTaskUseCase(taskRepository, projectRepository, labelRepository);

      await expect(useCase.execute({ title: 'Task', projectId: 'non-existent' })).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should throw NotFoundError when label does not exist', async () => {
      const project = createProject({ name: 'Test' }, 'proj-1');
      vi.mocked(projectRepository.findById).mockResolvedValue(project);
      vi.mocked(labelRepository.findByIds).mockResolvedValue([]); // Returns empty, meaning labels not found

      const useCase = new CreateTaskUseCase(taskRepository, projectRepository, labelRepository);

      await expect(
        useCase.execute({ title: 'Task', projectId: 'proj-1', labelIds: ['non-existent-label'] }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when label belongs to different project', async () => {
      const project = createProject({ name: 'Test' }, 'proj-1');
      const label = createLabel({ name: 'Label', projectId: 'proj-2' }, 'label-1'); // Different project
      vi.mocked(projectRepository.findById).mockResolvedValue(project);
      vi.mocked(labelRepository.findByIds).mockResolvedValue([label]);

      const useCase = new CreateTaskUseCase(taskRepository, projectRepository, labelRepository);

      await expect(
        useCase.execute({ title: 'Task', projectId: 'proj-1', labelIds: ['label-1'] }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('GetTaskUseCase', () => {
    it('should return task when found', async () => {
      const task = createTask({ title: 'Test Task' }, 'task-1');
      vi.mocked(taskRepository.findById).mockResolvedValue(task);

      const useCase = new GetTaskUseCase(taskRepository);
      const result = await useCase.execute({ id: 'task-1' });

      expect(result.id).toBe('task-1');
      expect(result.title).toBe('Test Task');
    });

    it('should throw NotFoundError when task not found', async () => {
      vi.mocked(taskRepository.findById).mockResolvedValue(null);

      const useCase = new GetTaskUseCase(taskRepository);

      await expect(useCase.execute({ id: 'non-existent' })).rejects.toThrow(NotFoundError);
    });
  });

  describe('UpdateTaskUseCase', () => {
    it('should update task successfully', async () => {
      const task = createTask({ title: 'Original', projectId: 'proj-1' }, 'task-1');
      vi.mocked(taskRepository.findById).mockResolvedValue(task);
      vi.mocked(labelRepository.findByIds).mockResolvedValue([]);
      vi.mocked(taskRepository.update).mockImplementation(async (t) => t);

      const useCase = new UpdateTaskUseCase(taskRepository, labelRepository);
      const result = await useCase.execute({ id: 'task-1', title: 'Updated' });

      expect(result.title).toBe('Updated');
    });

    it('should throw NotFoundError when task not found', async () => {
      vi.mocked(taskRepository.findById).mockResolvedValue(null);

      const useCase = new UpdateTaskUseCase(taskRepository, labelRepository);

      await expect(useCase.execute({ id: 'non-existent', title: 'New' })).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('DeleteTaskUseCase', () => {
    it('should delete task successfully', async () => {
      const task = createTask({ title: 'Test' }, 'task-1');
      vi.mocked(taskRepository.findById).mockResolvedValue(task);
      vi.mocked(taskRepository.delete).mockResolvedValue(undefined);

      const useCase = new DeleteTaskUseCase(taskRepository);
      await useCase.execute({ id: 'task-1' });

      expect(taskRepository.delete).toHaveBeenCalledWith('task-1');
    });

    it('should throw NotFoundError when task not found', async () => {
      vi.mocked(taskRepository.findById).mockResolvedValue(null);

      const useCase = new DeleteTaskUseCase(taskRepository);

      await expect(useCase.execute({ id: 'non-existent' })).rejects.toThrow(NotFoundError);
    });
  });

  describe('ListTasksUseCase', () => {
    it('should return paginated tasks with filters', async () => {
      const tasks = [
        createTask({ title: 'Task 1', projectId: 'proj-1' }),
        createTask({ title: 'Task 2', projectId: 'proj-1' }),
      ];
      vi.mocked(taskRepository.findAll).mockResolvedValue({
        data: tasks,
        hasMore: false,
      });

      const useCase = new ListTasksUseCase(taskRepository);
      const result = await useCase.execute({ projectId: 'proj-1' });

      expect(result.data).toHaveLength(2);
      expect(taskRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ projectId: 'proj-1' }),
        }),
      );
    });
  });
});

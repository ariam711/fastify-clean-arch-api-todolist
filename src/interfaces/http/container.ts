// Label Use Cases
import {
  CreateLabelUseCase,
  DeleteLabelUseCase,
  GetLabelUseCase,
  ListLabelsUseCase,
  UpdateLabelUseCase,
} from '@app/use-cases/label/index.js';
// Project Use Cases
import {
  CreateProjectUseCase,
  DeleteProjectUseCase,
  GetProjectUseCase,
  ListProjectsUseCase,
  UpdateProjectUseCase,
} from '@app/use-cases/project/index.js';
// Task Use Cases
import {
  CreateTaskUseCase,
  DeleteTaskUseCase,
  GetTaskUseCase,
  ListTasksUseCase,
  UpdateTaskUseCase,
} from '@app/use-cases/task/index.js';
import { LabelRepository } from '@infra/repositories/label.repository.js';
// Repositories
import { ProjectRepository } from '@infra/repositories/project.repository.js';
import { TaskRepository } from '@infra/repositories/task.repository.js';
import { type AwilixContainer, asClass, asValue, createContainer, InjectionMode } from 'awilix';
import type { Db } from 'mongodb';

export interface ContainerDependencies {
  db: Db;
}

export function createDIContainer(deps: ContainerDependencies): AwilixContainer {
  const container = createContainer({
    injectionMode: InjectionMode.CLASSIC,
  });

  container.register({
    // Database
    db: asValue(deps.db),

    // Repositories
    projectRepository: asClass(ProjectRepository).singleton(),
    taskRepository: asClass(TaskRepository).singleton(),
    labelRepository: asClass(LabelRepository).singleton(),

    // Project Use Cases
    createProjectUseCase: asClass(CreateProjectUseCase).scoped(),
    getProjectUseCase: asClass(GetProjectUseCase).scoped(),
    listProjectsUseCase: asClass(ListProjectsUseCase).scoped(),
    updateProjectUseCase: asClass(UpdateProjectUseCase).scoped(),
    deleteProjectUseCase: asClass(DeleteProjectUseCase).scoped(),

    // Task Use Cases
    createTaskUseCase: asClass(CreateTaskUseCase).scoped(),
    getTaskUseCase: asClass(GetTaskUseCase).scoped(),
    listTasksUseCase: asClass(ListTasksUseCase).scoped(),
    updateTaskUseCase: asClass(UpdateTaskUseCase).scoped(),
    deleteTaskUseCase: asClass(DeleteTaskUseCase).scoped(),

    // Label Use Cases
    createLabelUseCase: asClass(CreateLabelUseCase).scoped(),
    getLabelUseCase: asClass(GetLabelUseCase).scoped(),
    listLabelsUseCase: asClass(ListLabelsUseCase).scoped(),
    updateLabelUseCase: asClass(UpdateLabelUseCase).scoped(),
    deleteLabelUseCase: asClass(DeleteLabelUseCase).scoped(),
  });

  return container;
}

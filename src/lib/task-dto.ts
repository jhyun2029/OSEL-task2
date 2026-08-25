import type { ActivityLog, PlanStep, Project, Task } from "@prisma/client";
import { computeProgress } from "@/lib/progress";
import type {
  ActivityLogDto,
  PlanStepDto,
  ProjectDto,
  TaskDto,
} from "@/lib/types";
import type { ActivityType, Importance, TaskStatus, Visibility } from "@/lib/enums";

export const taskInclude = {
  project: true,
  planSteps: { orderBy: { order: "asc" as const } },
  activityLogs: { orderBy: { createdAt: "desc" as const }, take: 20 },
};

export type TaskWithRelations = Task & {
  project: Project | null;
  planSteps: PlanStep[];
  activityLogs: ActivityLog[];
};

/**
 * Normalizes a Prisma Task (Date objects, untyped string "enum" columns —
 * SQLite has no native enum, see prisma/schema.prisma) into the plain-JSON
 * TaskDto shape shared by API responses and server-component data loaders.
 * Adds the derived `progress` field every client needs to render task UI.
 */
export function toTaskDto(task: TaskWithRelations): TaskDto {
  return {
    ...task,
    importance: task.importance as Importance,
    status: task.status as TaskStatus,
    visibility: task.visibility as Visibility,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    startDate: task.startDate ? task.startDate.toISOString() : null,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    progress: computeProgress(task, task.planSteps),
    project: task.project ? toProjectDto(task.project) : null,
    planSteps: task.planSteps.map(toPlanStepDto),
    activityLogs: task.activityLogs.map(toActivityLogDto),
  };
}

export function toProjectDto(
  project: Project & { _count?: { tasks: number } }
): ProjectDto {
  return {
    ...project,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

function toPlanStepDto(step: PlanStep): PlanStepDto {
  return {
    ...step,
    plannedStartDate: step.plannedStartDate ? step.plannedStartDate.toISOString() : null,
    plannedEndDate: step.plannedEndDate ? step.plannedEndDate.toISOString() : null,
    completedAt: step.completedAt ? step.completedAt.toISOString() : null,
  };
}

function toActivityLogDto(log: ActivityLog): ActivityLogDto {
  return {
    ...log,
    type: log.type as ActivityType,
    createdAt: log.createdAt.toISOString(),
  };
}

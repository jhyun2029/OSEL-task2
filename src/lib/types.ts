import type {
  ActivityType,
  Importance,
  TaskStatus,
  Visibility,
} from "@/lib/enums";

// Client-side mirror of the API's JSON shape: Prisma Date fields become ISO
// strings once they cross a fetch() boundary, so these types intentionally
// diverge from the Prisma model types (which the API routes/server use
// directly instead).

export type PlanStepDto = {
  id: string;
  title: string;
  order: number;
  isDone: boolean;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
  completedAt: string | null;
  taskId: string;
};

export type ActivityLogDto = {
  id: string;
  type: ActivityType;
  message: string;
  metadata: string | null;
  createdAt: string;
  taskId: string;
  actorId: string | null;
};

export type ProjectDto = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  _count?: { tasks: number };
};

export type UserDto = {
  id: string;
  name: string;
};

export type TaskDto = {
  id: string;
  title: string;
  description: string | null;
  tags: string | null;
  importance: Importance;
  status: TaskStatus;
  progressPercent: number | null;
  progress: number; // derived, always present
  startDate: string | null;
  dueDate: string | null;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  owner: UserDto;
  projectId: string | null;
  project: ProjectDto | null;
  planSteps: PlanStepDto[];
  activityLogs: ActivityLogDto[];
};

import "server-only";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import {
  taskInclude,
  toProjectDto,
  toTaskDto,
  type TaskWithRelations,
} from "@/lib/task-dto";

/** Server-component data loaders (direct Prisma access, no HTTP round trip). */

export async function listTasksForCurrentUser() {
  const user = await getCurrentUser();
  const tasks = (await prisma.task.findMany({
    where: { ownerId: user.id },
    include: taskInclude,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  })) as TaskWithRelations[];
  return tasks.map(toTaskDto);
}

export async function getTaskForCurrentUser(id: string) {
  const user = await getCurrentUser();
  const task = (await prisma.task.findFirst({
    where: { id, ownerId: user.id },
    include: taskInclude,
  })) as TaskWithRelations | null;
  return task ? toTaskDto(task) : null;
}

export async function listProjectsForCurrentUser() {
  const user = await getCurrentUser();
  const projects = await prisma.project.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { tasks: true } } },
  });
  return projects.map(toProjectDto);
}

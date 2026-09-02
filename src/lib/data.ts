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

// 팀 공유 규칙: 내 업무는 전부, 남의 업무는 TEAM_SHARED만.
function visibleTo(userId: string) {
  return { OR: [{ ownerId: userId }, { visibility: "TEAM_SHARED" }] };
}

export async function listTasksForCurrentUser() {
  const user = await getCurrentUser();
  const tasks = (await prisma.task.findMany({
    where: visibleTo(user.id),
    include: taskInclude,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  })) as TaskWithRelations[];
  return tasks.map(toTaskDto);
}

export async function getTaskForCurrentUser(id: string) {
  const user = await getCurrentUser();
  const task = (await prisma.task.findFirst({
    where: { id, ...visibleTo(user.id) },
    include: taskInclude,
  })) as TaskWithRelations | null;
  return task ? toTaskDto(task) : null;
}

// 프로젝트는 팀 공용: 모든 멤버가 같은 목록을 보고 함께 분류에 쓴다.
export async function listProjectsForCurrentUser() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { tasks: true } } },
  });
  return projects.map(toProjectDto);
}

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, isAdmin: true },
  });
}

// 멤버 관리 화면용: 업무 수 포함 목록.
export async function listUsersWithTaskCounts() {
  return prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      isAdmin: true,
      createdAt: true,
      _count: { select: { tasks: true } },
    },
  });
}

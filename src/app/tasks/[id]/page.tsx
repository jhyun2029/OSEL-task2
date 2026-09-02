import { notFound } from "next/navigation";
import {
  getTaskForCurrentUser,
  listProjectsForCurrentUser,
  listUsers,
} from "@/lib/data";
import { getCurrentUser } from "@/lib/current-user";
import TaskDetailClient from "./TaskDetailClient";

export const dynamic = "force-dynamic";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [task, projects, currentUser, users] = await Promise.all([
    getTaskForCurrentUser(id),
    listProjectsForCurrentUser(),
    getCurrentUser(),
    listUsers(),
  ]);

  if (!task) notFound();

  return (
    <TaskDetailClient
      initialTask={task}
      projects={projects}
      users={users}
      readOnly={task.ownerId !== currentUser.id}
      isAdmin={currentUser.isAdmin}
    />
  );
}

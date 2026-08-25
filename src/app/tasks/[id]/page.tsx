import { notFound } from "next/navigation";
import { getTaskForCurrentUser, listProjectsForCurrentUser } from "@/lib/data";
import TaskDetailClient from "./TaskDetailClient";

export const dynamic = "force-dynamic";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [task, projects] = await Promise.all([
    getTaskForCurrentUser(id),
    listProjectsForCurrentUser(),
  ]);

  if (!task) notFound();

  return <TaskDetailClient initialTask={task} projects={projects} />;
}

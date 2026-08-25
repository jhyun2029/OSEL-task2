import Link from "next/link";
import { listProjectsForCurrentUser, listTasksForCurrentUser } from "@/lib/data";
import TaskListClient from "./TaskListClient";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const [tasks, projects] = await Promise.all([
    listTasksForCurrentUser(),
    listProjectsForCurrentUser(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">할 일 목록</h1>
        <Link
          href="/tasks/new"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          + 새 업무
        </Link>
      </div>
      <TaskListClient initialTasks={tasks} projects={projects} />
    </div>
  );
}

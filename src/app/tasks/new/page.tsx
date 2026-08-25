import { listProjectsForCurrentUser } from "@/lib/data";
import NewTaskForm from "./NewTaskForm";

export const dynamic = "force-dynamic";

export default async function NewTaskPage() {
  const projects = await listProjectsForCurrentUser();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">새 업무 등록</h1>
      <NewTaskForm projects={projects} />
    </div>
  );
}

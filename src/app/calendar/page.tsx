import { listTasksForCurrentUser } from "@/lib/data";
import CalendarClient from "./CalendarClient";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const tasks = await listTasksForCurrentUser();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">캘린더</h1>
      <CalendarClient tasks={tasks} />
    </div>
  );
}

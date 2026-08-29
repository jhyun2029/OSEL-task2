import { listTasksForCurrentUser, listUsers } from "@/lib/data";
import { getCurrentUser } from "@/lib/current-user";
import CalendarClient from "./CalendarClient";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const [tasks, users, currentUser] = await Promise.all([
    listTasksForCurrentUser(),
    listUsers(),
    getCurrentUser(),
  ]);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">캘린더</h1>
      <CalendarClient tasks={tasks} users={users} currentUserId={currentUser.id} />
    </div>
  );
}

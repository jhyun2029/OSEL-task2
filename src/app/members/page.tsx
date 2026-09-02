import { getCurrentUser } from "@/lib/current-user";
import { listUsersWithTaskCounts } from "@/lib/data";
import MembersClient from "./MembersClient";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const me = await getCurrentUser();

  if (!me.isAdmin) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center">
        <p className="text-sm text-slate-600">
          멤버 관리는 전체 관리자만 접근할 수 있습니다.
        </p>
      </div>
    );
  }

  const users = await listUsersWithTaskCounts();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">멤버 관리</h1>
      <MembersClient
        initialMembers={users.map((u) => ({
          id: u.id,
          name: u.name,
          isAdmin: u.isAdmin,
          createdAt: u.createdAt.toISOString(),
          taskCount: u._count.tasks,
        }))}
        currentUserId={me.id}
      />
    </div>
  );
}

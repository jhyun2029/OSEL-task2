"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Member = {
  id: string;
  name: string;
  isAdmin: boolean;
  createdAt: string;
  taskCount: number;
};

export default function MembersClient({
  initialMembers,
  currentUserId,
}: {
  initialMembers: Member[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  // confirm() 팝업 미지원 환경 대응: "한 번 더 클릭" 확인 방식.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function deleteMember(m: Member) {
    if (confirmingId !== m.id) {
      setConfirmingId(m.id);
      setError(null);
      setTimeout(() => setConfirmingId((c) => (c === m.id ? null : c)), 4000);
      return;
    }
    setConfirmingId(null);
    setPending(m.id);
    const res = await fetch(`/api/users/${m.id}`, { method: "DELETE" });
    setPending(null);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(
        typeof data?.error === "string" ? data.error : "삭제하지 못했습니다."
      );
      return;
    }
    setMembers((prev) => prev.filter((x) => x.id !== m.id));
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {members.map((m) => {
          const deletable = !m.isAdmin && m.id !== currentUserId;
          return (
            <li
              key={m.id}
              className={`flex items-center gap-3 p-4 ${
                pending === m.id ? "opacity-50" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <span className="font-medium text-slate-900">{m.name}</span>
                {m.isAdmin && (
                  <span className="ml-2 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                    관리자
                  </span>
                )}
                <p className="mt-0.5 text-xs text-slate-400">
                  가입 {new Date(m.createdAt).toLocaleDateString("ko-KR")} · 업무{" "}
                  {m.taskCount}건
                </p>
              </div>
              {deletable ? (
                <button
                  onClick={() => deleteMember(m)}
                  disabled={pending === m.id}
                  className={`text-xs font-medium hover:underline ${
                    confirmingId === m.id
                      ? "rounded bg-red-600 px-2 py-1 text-white"
                      : "text-red-600"
                  }`}
                >
                  {confirmingId === m.id
                    ? `정말 삭제? (업무 ${m.taskCount}건 함께 삭제됨)`
                    : "삭제"}
                </button>
              ) : (
                <span className="text-xs text-slate-400">삭제 불가</span>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-slate-400">
        멤버를 삭제하면 그 멤버의 업무와 프로젝트도 함께 삭제됩니다. 기록을
        보존하려면 삭제 전에 업무를 다른 멤버에게 옮기거나 백업을 확인하세요.
      </p>
    </div>
  );
}

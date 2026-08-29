"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserDto } from "@/lib/types";

const ADD_VALUE = "__add__";

/**
 * 신뢰 기반 "이름 선택" 로그인. 선택한 멤버 id를 uid 쿠키에 저장하면
 * 서버(getCurrentUser)가 그 쿠키로 현재 사용자를 결정한다.
 * 멤버 추가는 window.prompt를 지원하지 않는 환경(임베디드 브라우저 등)이
 * 있어 인라인 입력창으로 처리한다.
 */
export default function UserPicker({
  users,
  currentUserId,
}: {
  users: UserDto[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function selectUser(id: string) {
    document.cookie = `uid=${id}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  async function submitNewMember() {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(
        typeof data?.error === "string" ? data.error : "멤버를 추가하지 못했습니다."
      );
      return;
    }
    const created: UserDto = await res.json();
    setAdding(false);
    setName("");
    selectUser(created.id);
  }

  if (adding) {
    return (
      <div className="flex items-center gap-2">
        <input
          autoFocus
          className="w-32 rounded-md border border-slate-300 px-2 py-1 text-sm"
          placeholder="새 멤버 이름"
          value={name}
          disabled={busy}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitNewMember();
            if (e.key === "Escape") {
              setAdding(false);
              setName("");
              setError(null);
            }
          }}
        />
        <button
          onClick={submitNewMember}
          disabled={busy || !name.trim()}
          className="rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-40"
        >
          추가
        </button>
        <button
          onClick={() => {
            setAdding(false);
            setName("");
            setError(null);
          }}
          disabled={busy}
          className="text-xs text-slate-500 hover:underline"
        >
          취소
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }

  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <span className="hidden text-xs text-slate-400 sm:inline">멤버</span>
      <select
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
        value={currentUserId}
        onChange={(e) => {
          if (e.target.value === ADD_VALUE) {
            // select 값을 원래대로 되돌리고 인라인 입력 모드로 전환
            e.target.value = currentUserId;
            setAdding(true);
            return;
          }
          selectUser(e.target.value);
        }}
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
        <option value={ADD_VALUE}>+ 새 멤버 추가...</option>
      </select>
    </label>
  );
}

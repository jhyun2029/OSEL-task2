"use client";

import { useState } from "react";

// 공유 접속 코드 입력 화면. 성공하면 쿠키가 심어지고 /tasks로 이동한다.
export default function GatePage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/gate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(
        typeof data?.error === "string" ? data.error : "확인에 실패했습니다."
      );
      return;
    }
    window.location.href = "/tasks";
  }

  return (
    <div className="mx-auto mt-24 max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-lg font-semibold text-slate-900">연구실 접속 코드</h1>
      <p className="mt-1 text-sm text-slate-500">
        연구실에서 공유받은 접속 코드를 입력하세요. 한 번 입력하면 이
        브라우저에서는 다시 묻지 않습니다.
      </p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input
          autoFocus
          type="password"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="접속 코드"
          value={code}
          disabled={busy}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || !code.trim()}
          className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40"
        >
          {busy ? "확인 중..." : "입장"}
        </button>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { ProjectDto } from "@/lib/types";

export default function ProjectsClient({
  initialProjects,
}: {
  initialProjects: ProjectDto[];
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // confirm() 팝업 미지원 환경 대응: "한 번 더 클릭" 확인 방식.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 드래그 정렬: 드래그 중에는 로컬 순서만 바꾸고 드롭 시 한 번만 저장.
  const [dragId, setDragId] = useState<string | null>(null);

  function moveLocal(fromId: string, toId: string) {
    if (fromId === toId) return;
    setProjects((prev) => {
      const next = [...prev];
      const from = next.findIndex((p) => p.id === fromId);
      const to = next.findIndex((p) => p.id === toId);
      if (from < 0 || to < 0) return prev;
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  async function commitOrder() {
    if (!dragId) return;
    setDragId(null);
    await fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: projects.map((p) => p.id) }),
    });
  }

  async function addProject(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || null }),
    });
    if (res.ok) {
      const created = await res.json();
      setProjects((prev) => [...prev, { ...created, _count: { tasks: 0 } }]);
      setName("");
      setDescription("");
    }
    setSubmitting(false);
  }

  async function deleteProject(id: string) {
    if (confirmingId !== id) {
      setConfirmingId(id);
      setError(null);
      setTimeout(() => setConfirmingId((c) => (c === id ? null : c)), 4000);
      return;
    }
    setConfirmingId(null);
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      return;
    }
    const data = await res.json().catch(() => null);
    setError(
      typeof data?.error === "string" ? data.error : "프로젝트를 삭제하지 못했습니다."
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {projects.length === 0 && (
          <li className="p-4 text-sm text-slate-400">등록된 프로젝트가 없습니다.</li>
        )}
        {projects.map((p) => (
          <li
            key={p.id}
            draggable
            onDragStart={(e) => {
              setDragId(p.id);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragId) moveLocal(dragId, p.id);
            }}
            onDrop={(e) => e.preventDefault()}
            onDragEnd={commitOrder}
            className={`flex items-center justify-between gap-3 p-4 ${
              dragId === p.id ? "bg-slate-50 opacity-60" : ""
            }`}
          >
            <span
              className="cursor-grab select-none text-slate-300 active:cursor-grabbing"
              title="드래그해서 순서 변경"
              aria-hidden
            >
              ⠿
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-900">{p.name}</p>
              {p.description && <p className="text-sm text-slate-500">{p.description}</p>}
              <p className="text-xs text-slate-400">업무 {p._count?.tasks ?? 0}건</p>
            </div>
            <button
              onClick={() => deleteProject(p.id)}
              className={`shrink-0 text-xs font-medium hover:underline ${
                confirmingId === p.id
                  ? "rounded bg-red-600 px-2 py-1 text-white"
                  : "text-red-600"
              }`}
            >
              {confirmingId === p.id
                ? `정말 삭제? (업무 ${p._count?.tasks ?? 0}건은 미분류로 이동)`
                : "삭제"}
            </button>
          </li>
        ))}
      </ul>

      <form
        onSubmit={addProject}
        className="space-y-3 rounded-lg border border-slate-200 bg-white p-4"
      >
        <p className="text-sm font-medium text-slate-700">새 프로젝트</p>
        <input
          className="input"
          placeholder="프로젝트명"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="input"
          placeholder="설명 (선택)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          추가
        </button>
      </form>
    </div>
  );
}

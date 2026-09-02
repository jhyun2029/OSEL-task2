"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TaskDto, ProjectDto, UserDto } from "@/lib/types";
import type { TaskStatus } from "@/lib/enums";
import {
  IMPORTANCE_LABELS,
  IMPORTANCE_ORDER,
  TASK_STATUS_LABELS,
  TASK_STATUS_ORDER,
} from "@/lib/constants";
import { ImportanceBadge, ProgressBar, StatusBadge } from "@/components/Badges";

type Props = {
  initialTasks: TaskDto[];
  projects: ProjectDto[];
  users: UserDto[];
  currentUserId: string;
};

const ALL = "ALL";

export default function TaskListClient({
  initialTasks,
  projects,
  users,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [importanceFilter, setImportanceFilter] = useState<string>(ALL);
  const [projectFilter, setProjectFilter] = useState<string>(ALL);
  const [ownerFilter, setOwnerFilter] = useState<string>(ALL);
  const [pending, setPending] = useState<string | null>(null);
  // confirm() 팝업을 지원하지 않는 환경이 있어 "한 번 더 클릭" 방식으로 확인.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  // 드래그 정렬: 드래그 중에는 로컬 순서만 바꾸고 드롭 시 한 번만 저장.
  // 필터가 걸려 있어도 보이는 업무들끼리 순서를 바꿀 수 있다.
  const [dragId, setDragId] = useState<string | null>(null);

  function moveLocal(fromId: string, toId: string) {
    if (fromId === toId) return;
    setTasks((prev) => {
      const next = [...prev];
      const from = next.findIndex((t) => t.id === fromId);
      const to = next.findIndex((t) => t.id === toId);
      if (from < 0 || to < 0) return prev;
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  async function commitOrder(visibleIds: string[]) {
    if (!dragId) return;
    setDragId(null);
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: visibleIds }),
    });
  }

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== ALL && t.status !== statusFilter) return false;
      if (importanceFilter !== ALL && t.importance !== importanceFilter)
        return false;
      if (ownerFilter !== ALL && t.ownerId !== ownerFilter) return false;
      if (projectFilter !== ALL) {
        if (projectFilter === "NONE" && t.projectId) return false;
        if (projectFilter !== "NONE" && t.projectId !== projectFilter)
          return false;
      }
      return true;
    });
  }, [tasks, statusFilter, importanceFilter, projectFilter, ownerFilter]);

  async function updateStatus(id: string, status: TaskStatus) {
    setPending(id);
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated: TaskDto = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
    setPending(null);
  }

  async function deleteTask(id: string) {
    if (confirmingId !== id) {
      setConfirmingId(id);
      setTimeout(() => setConfirmingId((c) => (c === id ? null : c)), 3000);
      return;
    }
    setConfirmingId(null);
    setPending(id);
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      router.refresh();
    }
    setPending(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white p-3">
        <FilterSelect
          label="상태"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: ALL, label: "전체" },
            ...TASK_STATUS_ORDER.map((s) => ({
              value: s,
              label: TASK_STATUS_LABELS[s],
            })),
          ]}
        />
        <FilterSelect
          label="중요도"
          value={importanceFilter}
          onChange={setImportanceFilter}
          options={[
            { value: ALL, label: "전체" },
            ...IMPORTANCE_ORDER.map((i) => ({
              value: i,
              label: IMPORTANCE_LABELS[i],
            })),
          ]}
        />
        <FilterSelect
          label="프로젝트"
          value={projectFilter}
          onChange={setProjectFilter}
          options={[
            { value: ALL, label: "전체" },
            { value: "NONE", label: "미분류" },
            ...projects.map((p) => ({ value: p.id, label: p.name })),
          ]}
        />
        <FilterSelect
          label="연구원"
          value={ownerFilter}
          onChange={setOwnerFilter}
          options={[
            { value: ALL, label: "전체" },
            ...users.map((u) => ({
              value: u.id,
              label: u.id === currentUserId ? `${u.name} (나)` : u.name,
            })),
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          조건에 맞는 업무가 없습니다.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {filtered.map((task) => (
            <li
              key={task.id}
              draggable
              onDragStart={(e) => {
                setDragId(task.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragId) moveLocal(dragId, task.id);
              }}
              onDrop={(e) => e.preventDefault()}
              onDragEnd={() => commitOrder(filtered.map((t) => t.id))}
              className={`flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4 ${
                dragId === task.id ? "bg-slate-50 opacity-60" : ""
              } ${pending === task.id ? "opacity-50" : ""}`}
            >
              <span
                className="hidden cursor-grab select-none text-slate-300 active:cursor-grabbing sm:inline"
                title="드래그해서 순서 변경"
                aria-hidden
              >
                ⠿
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/tasks/${task.id}`}
                  className="font-medium text-slate-900 hover:underline"
                >
                  {task.title}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      task.ownerId === currentUserId
                        ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {task.owner.name}
                  </span>
                  {task.visibility === "PRIVATE" && (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700">
                      개인 전용
                    </span>
                  )}
                  <ImportanceBadge value={task.importance} />
                  <StatusBadge value={task.status} />
                  {task.project && (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
                      {task.project.name}
                    </span>
                  )}
                  {task.dueDate && (
                    <span>마감 {new Date(task.dueDate).toLocaleDateString("ko-KR")}</span>
                  )}
                </div>
              </div>

              <div className="w-full sm:w-40">
                <ProgressBar value={task.progress} />
              </div>

              {task.ownerId === currentUserId ? (
                <>
                  <select
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    value={task.status}
                    disabled={pending === task.id}
                    onChange={(e) =>
                      updateStatus(task.id, e.target.value as TaskStatus)
                    }
                  >
                    {TASK_STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {TASK_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => deleteTask(task.id)}
                    disabled={pending === task.id}
                    className={`text-xs font-medium hover:underline ${
                      confirmingId === task.id
                        ? "rounded bg-red-600 px-2 py-0.5 text-white"
                        : "text-red-600"
                    }`}
                  >
                    {confirmingId === task.id ? "정말 삭제?" : "삭제"}
                  </button>
                </>
              ) : (
                <span className="text-xs text-slate-400">읽기 전용</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      {label}
      <select
        className="rounded-md border border-slate-300 px-2 py-1 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

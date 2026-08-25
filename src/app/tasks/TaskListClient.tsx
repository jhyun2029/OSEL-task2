"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TaskDto, ProjectDto } from "@/lib/types";
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
};

const ALL = "ALL";

export default function TaskListClient({ initialTasks, projects }: Props) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [importanceFilter, setImportanceFilter] = useState<string>(ALL);
  const [projectFilter, setProjectFilter] = useState<string>(ALL);
  const [pending, setPending] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== ALL && t.status !== statusFilter) return false;
      if (importanceFilter !== ALL && t.importance !== importanceFilter)
        return false;
      if (projectFilter !== ALL) {
        if (projectFilter === "NONE" && t.projectId) return false;
        if (projectFilter !== "NONE" && t.projectId !== projectFilter)
          return false;
      }
      return true;
    });
  }, [tasks, statusFilter, importanceFilter, projectFilter]);

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
    if (!confirm("이 업무를 삭제할까요? 되돌릴 수 없습니다.")) return;
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
              className={`flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4 ${
                pending === task.id ? "opacity-50" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/tasks/${task.id}`}
                  className="font-medium text-slate-900 hover:underline"
                >
                  {task.title}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
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
                className="text-xs font-medium text-red-600 hover:underline"
              >
                삭제
              </button>
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

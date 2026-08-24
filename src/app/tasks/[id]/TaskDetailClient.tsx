"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TaskDto, ProjectDto } from "@/lib/types";
import {
  ACTIVITY_TYPE_LABELS,
  IMPORTANCE_LABELS,
  IMPORTANCE_ORDER,
  TASK_STATUS_LABELS,
  TASK_STATUS_ORDER,
} from "@/lib/constants";
import { ProgressBar } from "@/components/Badges";

function toDateInput(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

export default function TaskDetailClient({
  initialTask,
  projects,
}: {
  initialTask: TaskDto;
  projects: ProjectDto[];
}) {
  const router = useRouter();
  const [task, setTask] = useState(initialTask);
  const [savingField, setSavingField] = useState<string | null>(null);

  async function patchTask(patch: Record<string, unknown>, field: string) {
    setSavingField(field);
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const updated: TaskDto = await res.json();
      setTask(updated);
    }
    setSavingField(null);
  }

  async function deleteTask() {
    if (!confirm("이 업무를 삭제할까요? 되돌릴 수 없습니다.")) return;
    const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/tasks");
      router.refresh();
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/tasks" className="text-sm text-slate-500 hover:underline">
          ← 목록으로
        </Link>
        <button
          onClick={deleteTask}
          className="text-xs font-medium text-red-600 hover:underline"
        >
          업무 삭제
        </button>
      </div>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        <input
          className="w-full border-none bg-transparent text-2xl font-semibold outline-none"
          value={task.title}
          onChange={(e) => setTask({ ...task, title: e.target.value })}
          onBlur={(e) => patchTask({ title: e.target.value }, "title")}
        />

        <textarea
          className="input min-h-24"
          placeholder="설명을 입력하세요"
          value={task.description ?? ""}
          onChange={(e) => setTask({ ...task, description: e.target.value })}
          onBlur={(e) => patchTask({ description: e.target.value || null }, "description")}
        />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <LabeledSelect
            label="상태"
            value={task.status}
            onChange={(v) => patchTask({ status: v }, "status")}
            options={TASK_STATUS_ORDER.map((s) => ({ value: s, label: TASK_STATUS_LABELS[s] }))}
          />
          <LabeledSelect
            label="중요도"
            value={task.importance}
            onChange={(v) => patchTask({ importance: v }, "importance")}
            options={IMPORTANCE_ORDER.map((i) => ({ value: i, label: IMPORTANCE_LABELS[i] }))}
          />
          <LabeledSelect
            label="프로젝트"
            value={task.projectId ?? ""}
            onChange={(v) => patchTask({ projectId: v || null }, "projectId")}
            options={[{ value: "", label: "미분류" }, ...projects.map((p) => ({ value: p.id, label: p.name }))]}
          />
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500">공개범위</span>
            <select className="input" disabled value="PRIVATE">
              <option value="PRIVATE">개인 전용</option>
              <option value="TEAM_SHARED">팀 공유 (준비 중)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500">시작일</span>
            <input
              type="date"
              className="input"
              value={toDateInput(task.startDate)}
              onChange={(e) => setTask({ ...task, startDate: e.target.value || null })}
              onBlur={(e) => patchTask({ startDate: e.target.value || null }, "startDate")}
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500">마감일</span>
            <input
              type="date"
              className="input"
              value={toDateInput(task.dueDate)}
              onChange={(e) => setTask({ ...task, dueDate: e.target.value || null })}
              onBlur={(e) => patchTask({ dueDate: e.target.value || null }, "dueDate")}
            />
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-medium text-slate-500">태그 (쉼표로 구분)</span>
          <input
            className="input"
            value={task.tags ?? ""}
            onChange={(e) => setTask({ ...task, tags: e.target.value })}
            onBlur={(e) => patchTask({ tags: e.target.value || null }, "tags")}
          />
        </div>

        <ProgressSection task={task} patchTask={patchTask} />
        {savingField && <p className="text-xs text-slate-400">저장 중...</p>}
      </section>

      <PlanStepsSection task={task} setTask={setTask} />
      <ActivityLogSection task={task} />
    </div>
  );
}

function ProgressSection({
  task,
  patchTask,
}: {
  task: TaskDto;
  patchTask: (patch: Record<string, unknown>, field: string) => void;
}) {
  const isManual = task.progressPercent !== null;
  return (
    <div className="space-y-2 rounded-md border border-slate-200 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">
          진행률 {isManual ? "(수동 입력)" : "(하위 단계 기준 자동 계산)"}
        </span>
        {isManual && (
          <button
            className="text-xs text-slate-500 hover:underline"
            onClick={() => patchTask({ progressPercent: null }, "progressPercent")}
          >
            자동 계산으로 전환
          </button>
        )}
      </div>
      <ProgressBar value={task.progress} />
      <input
        type="range"
        min={0}
        max={100}
        value={task.progress}
        onChange={(e) =>
          patchTask({ progressPercent: Number(e.target.value) }, "progressPercent")
        }
        className="w-full"
      />
    </div>
  );
}

function PlanStepsSection({
  task,
  setTask,
}: {
  task: TaskDto;
  setTask: (t: TaskDto) => void;
}) {
  const [newTitle, setNewTitle] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch(`/api/tasks/${task.id}`);
    if (res.ok) setTask(await res.json());
  }

  async function toggleStep(stepId: string, isDone: boolean) {
    setBusyId(stepId);
    await fetch(`/api/tasks/${task.id}/plan-steps/${stepId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDone }),
    });
    await refresh();
    setBusyId(null);
  }

  async function removeStep(stepId: string) {
    setBusyId(stepId);
    await fetch(`/api/tasks/${task.id}/plan-steps/${stepId}`, { method: "DELETE" });
    await refresh();
    setBusyId(null);
  }

  async function addStep() {
    if (!newTitle.trim()) return;
    setBusyId("new");
    await fetch(`/api/tasks/${task.id}/plan-steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    setNewTitle("");
    await refresh();
    setBusyId(null);
  }

  return (
    <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-700">진행 계획 (하위 단계)</h2>
      {task.planSteps.length === 0 && (
        <p className="text-sm text-slate-400">등록된 단계가 없습니다.</p>
      )}
      <ul className="space-y-2">
        {task.planSteps.map((step) => (
          <li
            key={step.id}
            className={`flex items-center gap-3 rounded-md border border-slate-200 p-2 ${
              busyId === step.id ? "opacity-50" : ""
            }`}
          >
            <input
              type="checkbox"
              checked={step.isDone}
              onChange={(e) => toggleStep(step.id, e.target.checked)}
              className="size-4"
            />
            <span className={`flex-1 text-sm ${step.isDone ? "text-slate-400 line-through" : ""}`}>
              {step.title}
            </span>
            {(step.plannedStartDate || step.plannedEndDate) && (
              <span className="text-xs text-slate-400">
                {toDateInput(step.plannedStartDate)} ~ {toDateInput(step.plannedEndDate)}
              </span>
            )}
            <button
              onClick={() => removeStep(step.id)}
              className="text-xs text-red-600 hover:underline"
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="새 단계 제목"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addStep()}
        />
        <button
          onClick={addStep}
          disabled={busyId === "new"}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          추가
        </button>
      </div>
    </section>
  );
}

function ActivityLogSection({ task }: { task: TaskDto }) {
  return (
    <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-700">활동 이력</h2>
      {task.activityLogs.length === 0 ? (
        <p className="text-sm text-slate-400">아직 기록이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {task.activityLogs.map((log) => (
            <li key={log.id} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                {ACTIVITY_TYPE_LABELS[log.type]}
              </span>
              <span className="flex-1 text-slate-700">{log.message}</span>
              <span className="shrink-0 text-xs text-slate-400">
                {new Date(log.createdAt).toLocaleString("ko-KR")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function LabeledSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T | string;
  onChange: (v: T) => void;
  options: { value: T | string; label: string }[];
}) {
  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <select
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

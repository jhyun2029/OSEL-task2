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
  readOnly = false,
}: {
  initialTask: TaskDto;
  projects: ProjectDto[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [task, setTask] = useState(initialTask);
  const [savingField, setSavingField] = useState<string | null>(null);
  // confirm() 팝업을 지원하지 않는 환경이 있어 "한 번 더 클릭" 방식으로 확인.
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function patchTask(patch: Record<string, unknown>, field: string) {
    if (readOnly) return;
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
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      setTimeout(() => setConfirmingDelete(false), 3000);
      return;
    }
    setConfirmingDelete(false);
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
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {task.owner.name}
            {readOnly && " · 읽기 전용"}
          </span>
          {!readOnly && (
            <button
              onClick={deleteTask}
              className={`text-xs font-medium hover:underline ${
                confirmingDelete
                  ? "rounded bg-red-600 px-2 py-0.5 text-white"
                  : "text-red-600"
              }`}
            >
              {confirmingDelete ? "정말 삭제?" : "업무 삭제"}
            </button>
          )}
        </div>
      </div>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        {!readOnly && (
          <p className="text-xs text-slate-400">
            ✏️ 제목·설명을 비롯한 모든 항목은 클릭해서 바로 수정할 수 있습니다.
            수정하면 자동 저장됩니다.
          </p>
        )}
        <input
          className="-mx-1 w-full rounded-md border border-transparent bg-transparent px-1 text-2xl font-semibold outline-none transition-colors hover:border-slate-200 focus:border-slate-300"
          value={task.title}
          disabled={readOnly}
          onChange={(e) => setTask({ ...task, title: e.target.value })}
          onBlur={(e) => patchTask({ title: e.target.value }, "title")}
        />

        <textarea
          className="input min-h-24"
          placeholder="설명을 입력하세요"
          value={task.description ?? ""}
          disabled={readOnly}
          onChange={(e) => setTask({ ...task, description: e.target.value })}
          onBlur={(e) => patchTask({ description: e.target.value || null }, "description")}
        />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <LabeledSelect
            label="상태"
            value={task.status}
            disabled={readOnly}
            onChange={(v) => patchTask({ status: v }, "status")}
            options={TASK_STATUS_ORDER.map((s) => ({ value: s, label: TASK_STATUS_LABELS[s] }))}
          />
          <LabeledSelect
            label="중요도"
            value={task.importance}
            disabled={readOnly}
            onChange={(v) => patchTask({ importance: v }, "importance")}
            options={IMPORTANCE_ORDER.map((i) => ({ value: i, label: IMPORTANCE_LABELS[i] }))}
          />
          <LabeledSelect
            label="프로젝트"
            value={task.projectId ?? ""}
            disabled={readOnly}
            onChange={(v) => patchTask({ projectId: v || null }, "projectId")}
            options={[{ value: "", label: "미분류" }, ...projects.map((p) => ({ value: p.id, label: p.name }))]}
          />
          <LabeledSelect
            label="공개범위"
            value={task.visibility}
            disabled={readOnly}
            onChange={(v) => patchTask({ visibility: v }, "visibility")}
            options={[
              { value: "TEAM_SHARED", label: "팀 공유" },
              { value: "PRIVATE", label: "개인 전용" },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500">시작일</span>
            <input
              type="date"
              className="input"
              value={toDateInput(task.startDate)}
              disabled={readOnly}
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
              disabled={readOnly}
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
            disabled={readOnly}
            onChange={(e) => setTask({ ...task, tags: e.target.value })}
            onBlur={(e) => patchTask({ tags: e.target.value || null }, "tags")}
          />
        </div>

        <ProgressSection task={task} patchTask={patchTask} readOnly={readOnly} />
        {savingField && <p className="text-xs text-slate-400">저장 중...</p>}
      </section>

      <PlanStepsSection task={task} setTask={setTask} readOnly={readOnly} />
      <ActivityLogSection task={task} />
    </div>
  );
}

function ProgressSection({
  task,
  patchTask,
  readOnly,
}: {
  task: TaskDto;
  patchTask: (patch: Record<string, unknown>, field: string) => Promise<void>;
  readOnly: boolean;
}) {
  // 슬라이더를 움직이는 동안에는 draft에만 반영하고, 저장 버튼을 눌렀을 때
  // 한 번만 PATCH해서 활동 이력이 조작 단위당 1건만 남게 한다.
  const [draft, setDraft] = useState<number | null>(null);
  const isManual = task.progressPercent !== null;
  const shown = draft ?? task.progress;
  const dirty = draft !== null && draft !== task.progress;

  async function save() {
    if (draft === null) return;
    await patchTask({ progressPercent: draft }, "progressPercent");
    setDraft(null);
  }

  return (
    <div className="space-y-2 rounded-md border border-slate-200 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">
          진행률 {isManual ? "(수동 입력)" : "(하위 단계 기준 자동 계산)"}
        </span>
        {isManual && !readOnly && (
          <button
            className="text-xs text-slate-500 hover:underline"
            onClick={() => {
              setDraft(null);
              patchTask({ progressPercent: null }, "progressPercent");
            }}
          >
            자동 계산으로 전환
          </button>
        )}
      </div>
      <ProgressBar value={shown} />
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={100}
          value={shown}
          disabled={readOnly}
          onChange={(e) => setDraft(Number(e.target.value))}
          className="w-full"
        />
        <span className="w-10 shrink-0 text-right text-sm tabular-nums text-slate-600">
          {shown}%
        </span>
        {!readOnly && (
          <button
            onClick={save}
            disabled={!dirty}
            className="shrink-0 rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-30"
          >
            저장
          </button>
        )}
      </div>
    </div>
  );
}

function PlanStepsSection({
  task,
  setTask,
  readOnly,
}: {
  task: TaskDto;
  setTask: (t: TaskDto) => void;
  readOnly: boolean;
}) {
  const [newTitle, setNewTitle] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  // 드래그 중인 단계 id. 드래그하는 동안에는 로컬 순서만 바꾸고(미리보기),
  // 드롭이 끝나면 최종 순서를 한 번만 서버에 저장한다.
  const [dragId, setDragId] = useState<string | null>(null);
  // 수정 중인 단계와 임시 입력값. 저장을 눌러야 서버에 반영된다.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ title: "", start: "", end: "" });

  function startEdit(step: TaskDto["planSteps"][number]) {
    setEditingId(step.id);
    setEditDraft({
      title: step.title,
      start: toDateInput(step.plannedStartDate),
      end: toDateInput(step.plannedEndDate),
    });
  }

  async function saveEdit() {
    if (!editingId || !editDraft.title.trim()) return;
    setBusyId(editingId);
    await fetch(`/api/tasks/${task.id}/plan-steps/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editDraft.title.trim(),
        plannedStartDate: editDraft.start || null,
        plannedEndDate: editDraft.end || null,
      }),
    });
    setEditingId(null);
    await refresh();
    setBusyId(null);
  }

  async function refresh() {
    const res = await fetch(`/api/tasks/${task.id}`);
    if (res.ok) setTask(await res.json());
  }

  function moveLocal(fromId: string, toId: string) {
    if (fromId === toId) return;
    const steps = [...task.planSteps];
    const from = steps.findIndex((s) => s.id === fromId);
    const to = steps.findIndex((s) => s.id === toId);
    if (from < 0 || to < 0) return;
    const [moved] = steps.splice(from, 1);
    steps.splice(to, 0, moved);
    setTask({ ...task, planSteps: steps });
  }

  async function commitOrder() {
    if (!dragId) return;
    setDragId(null);
    await fetch(`/api/tasks/${task.id}/plan-steps`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: task.planSteps.map((s) => s.id) }),
    });
    await refresh();
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
            draggable={!readOnly}
            onDragStart={(e) => {
              if (readOnly) return;
              setDragId(step.id);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
              if (readOnly) return;
              e.preventDefault();
              if (dragId) moveLocal(dragId, step.id);
            }}
            onDrop={(e) => e.preventDefault()}
            onDragEnd={commitOrder}
            className={`flex items-center gap-3 rounded-md border p-2 ${
              dragId === step.id
                ? "border-slate-400 bg-slate-50 opacity-60"
                : "border-slate-200"
            } ${busyId === step.id ? "opacity-50" : ""}`}
          >
            {!readOnly && (
              <span
                className="cursor-grab select-none text-slate-300 active:cursor-grabbing"
                title="드래그해서 순서 변경"
                aria-hidden
              >
                ⠿
              </span>
            )}
            <input
              type="checkbox"
              checked={step.isDone}
              disabled={readOnly}
              onChange={(e) => toggleStep(step.id, e.target.checked)}
              className="size-4"
            />
            {editingId === step.id ? (
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <input
                  autoFocus
                  className="input min-w-32 flex-1"
                  value={editDraft.title}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, title: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                />
                <input
                  type="date"
                  className="input w-36"
                  value={editDraft.start}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, start: e.target.value }))
                  }
                />
                <input
                  type="date"
                  className="input w-36"
                  value={editDraft.end}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, end: e.target.value }))
                  }
                />
                <button
                  onClick={saveEdit}
                  disabled={!editDraft.title.trim()}
                  className="rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-40"
                >
                  저장
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-xs text-slate-500 hover:underline"
                >
                  취소
                </button>
              </div>
            ) : (
              <>
                <span className={`flex-1 text-sm ${step.isDone ? "text-slate-400 line-through" : ""}`}>
                  {step.title}
                </span>
                {(step.plannedStartDate || step.plannedEndDate) && (
                  <span className="text-xs text-slate-400">
                    {toDateInput(step.plannedStartDate)} ~ {toDateInput(step.plannedEndDate)}
                  </span>
                )}
                {!readOnly && (
                  <>
                    <button
                      onClick={() => startEdit(step)}
                      className="text-xs text-slate-500 hover:underline"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => removeStep(step.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      삭제
                    </button>
                  </>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
      {!readOnly && (
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
      )}
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
  disabled = false,
}: {
  label: string;
  value: T | string;
  onChange: (v: T) => void;
  options: { value: T | string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <select
        className="input"
        value={value}
        disabled={disabled}
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

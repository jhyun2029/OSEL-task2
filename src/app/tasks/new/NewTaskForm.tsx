"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectDto } from "@/lib/types";
import { IMPORTANCE_LABELS, IMPORTANCE_ORDER } from "@/lib/constants";

type DraftStep = { title: string; plannedStartDate: string; plannedEndDate: string };

export default function NewTaskForm({ projects }: { projects: ProjectDto[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [projectId, setProjectId] = useState("");
  const [importance, setImportance] = useState("NORMAL");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [steps, setSteps] = useState<DraftStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function addStep() {
    setSteps((s) => [...s, { title: "", plannedStartDate: "", plannedEndDate: "" }]);
  }

  function updateStep(i: number, patch: Partial<DraftStep>) {
    setSteps((s) => s.map((step, idx) => (idx === i ? { ...step, ...patch } : step)));
  }

  function removeStep(i: number) {
    setSteps((s) => s.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("제목을 입력하세요.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || null,
        tags: tags || null,
        projectId: projectId || null,
        importance,
        startDate: startDate || null,
        dueDate: dueDate || null,
        planSteps: steps
          .filter((s) => s.title.trim())
          .map((s) => ({
            title: s.title,
            plannedStartDate: s.plannedStartDate || null,
            plannedEndDate: s.plannedEndDate || null,
          })),
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("업무를 저장하지 못했습니다. 입력값을 확인하세요.");
      return;
    }
    const task = await res.json();
    router.push(`/tasks/${task.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <Field label="제목 *">
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 논문 초안 작성"
        />
      </Field>

      <Field label="설명">
        <textarea
          className="input min-h-24"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="태그 (쉼표로 구분)">
          <input
            className="input"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="논문, 실험A"
          />
        </Field>
        <Field label="프로젝트">
          <select
            className="input"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">미분류</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="중요도">
          <select
            className="input"
            value={importance}
            onChange={(e) => setImportance(e.target.value)}
          >
            {IMPORTANCE_ORDER.map((i) => (
              <option key={i} value={i}>
                {IMPORTANCE_LABELS[i]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="공개범위">
          <select className="input" disabled defaultValue="PRIVATE">
            <option value="PRIVATE">개인 전용</option>
            <option value="TEAM_SHARED">팀 공유 (준비 중)</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="시작일">
          <input
            type="date"
            className="input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </Field>
        <Field label="마감일">
          <input
            type="date"
            className="input"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </Field>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">진행 계획 (하위 단계)</span>
          <button
            type="button"
            onClick={addStep}
            className="text-xs font-medium text-slate-600 hover:underline"
          >
            + 단계 추가
          </button>
        </div>
        {steps.map((step, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 p-2">
            <input
              className="input flex-1 min-w-32"
              placeholder={`단계 ${i + 1} 제목`}
              value={step.title}
              onChange={(e) => updateStep(i, { title: e.target.value })}
            />
            <input
              type="date"
              className="input w-36"
              value={step.plannedStartDate}
              onChange={(e) => updateStep(i, { plannedStartDate: e.target.value })}
            />
            <input
              type="date"
              className="input w-36"
              value={step.plannedEndDate}
              onChange={(e) => updateStep(i, { plannedEndDate: e.target.value })}
            />
            <button
              type="button"
              onClick={() => removeStep(i)}
              className="text-xs text-red-600 hover:underline"
            >
              제거
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {submitting ? "저장 중..." : "업무 저장"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

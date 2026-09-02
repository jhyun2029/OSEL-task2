"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectDto, TaskDto } from "@/lib/types";
import { IMPORTANCE_LABELS, IMPORTANCE_ORDER } from "@/lib/constants";

type DraftStep = { title: string; plannedStartDate: string; plannedEndDate: string };

const NEW_PROJECT = "__new__";

function toDateInput(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

export default function NewTaskForm({
  projects,
  existingTasks = [],
}: {
  projects: ProjectDto[];
  existingTasks?: TaskDto[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [projectId, setProjectId] = useState("");
  // 드롭다운에서 "+ 새 프로젝트 만들기" 선택 시 인라인 입력으로 즉석 생성.
  const [projectList, setProjectList] = useState(projects);
  const [addingProject, setAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [projectBusy, setProjectBusy] = useState(false);
  const [importance, setImportance] = useState("NORMAL");
  const [visibility, setVisibility] = useState("TEAM_SHARED");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [steps, setSteps] = useState<DraftStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // "기존 업무에서 복사": 선택한 업무의 내용을 입력창에 채워 넣고
  // 사용자가 수정 후 저장하는 템플릿 방식.
  const [copySourceId, setCopySourceId] = useState<string | null>(null);
  const [copiedFrom, setCopiedFrom] = useState<string | null>(null);

  function copyFromExisting() {
    const src = existingTasks.find((t) => t.id === copySourceId);
    if (!src) return;
    setTitle(src.title);
    setDescription(src.description ?? "");
    setTags(src.tags ?? "");
    setProjectId(src.projectId ?? "");
    setImportance(src.importance);
    setVisibility(src.visibility);
    setStartDate(toDateInput(src.startDate));
    setDueDate(toDateInput(src.dueDate));
    setSteps(
      src.planSteps.map((s) => ({
        title: s.title,
        plannedStartDate: toDateInput(s.plannedStartDate),
        plannedEndDate: toDateInput(s.plannedEndDate),
      }))
    );
    setCopiedFrom(`"${src.title}" (${src.owner.name})`);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addStep() {
    setSteps((s) => [...s, { title: "", plannedStartDate: "", plannedEndDate: "" }]);
  }

  function updateStep(i: number, patch: Partial<DraftStep>) {
    setSteps((s) => s.map((step, idx) => (idx === i ? { ...step, ...patch } : step)));
  }

  function removeStep(i: number) {
    setSteps((s) => s.filter((_, idx) => idx !== i));
  }

  async function createProject() {
    const name = newProjectName.trim();
    if (!name || projectBusy) return;
    setProjectBusy(true);
    setError(null);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setProjectBusy(false);
    if (!res.ok) {
      setError("프로젝트를 만들지 못했습니다.");
      return;
    }
    const created: ProjectDto = await res.json();
    setProjectList((prev) => [...prev, created]);
    setProjectId(created.id);
    setAddingProject(false);
    setNewProjectName("");
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
        visibility,
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
          {addingProject ? (
            <div className="flex gap-2">
              <input
                autoFocus
                className="input flex-1"
                placeholder="새 프로젝트 이름"
                value={newProjectName}
                disabled={projectBusy}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    createProject();
                  }
                  if (e.key === "Escape") {
                    setAddingProject(false);
                    setNewProjectName("");
                  }
                }}
              />
              <button
                type="button"
                onClick={createProject}
                disabled={projectBusy || !newProjectName.trim()}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40"
              >
                만들기
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddingProject(false);
                  setNewProjectName("");
                }}
                disabled={projectBusy}
                className="text-xs text-slate-500 hover:underline"
              >
                취소
              </button>
            </div>
          ) : (
            <select
              className="input"
              value={projectId}
              onChange={(e) => {
                if (e.target.value === NEW_PROJECT) {
                  e.target.value = projectId;
                  setAddingProject(true);
                  return;
                }
                setProjectId(e.target.value);
              }}
            >
              <option value="">미분류</option>
              {projectList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
              <option value={NEW_PROJECT}>+ 새 프로젝트 만들기...</option>
            </select>
          )}
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
          <select
            className="input"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          >
            <option value="TEAM_SHARED">팀 공유 (모두 볼 수 있음)</option>
            <option value="PRIVATE">개인 전용 (나만 볼 수 있음)</option>
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

      {existingTasks.length > 0 && (
        <div className="space-y-2 border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              기존 업무에서 복사
            </span>
            <button
              type="button"
              onClick={copyFromExisting}
              disabled={!copySourceId}
              className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            >
              선택한 업무 내용 가져오기
            </button>
          </div>
          <p className="text-xs text-slate-400">
            업무를 선택하고 버튼을 누르면 위 입력창에 내용이 채워집니다. 필요한
            부분만 수정한 뒤 저장하세요. (진행 상태는 복사되지 않습니다)
          </p>
          {copiedFrom && (
            <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700">
              {copiedFrom} 업무의 내용을 가져왔습니다. 수정 후 저장하세요.
            </p>
          )}
          <ul className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2">
            {existingTasks.map((t) => (
              <li key={t.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50">
                  <input
                    type="radio"
                    name="copySource"
                    checked={copySourceId === t.id}
                    onChange={() => setCopySourceId(t.id)}
                    className="size-3.5"
                  />
                  <span className="flex-1 truncate text-slate-800">{t.title}</span>
                  <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
                    {t.owner.name}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
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

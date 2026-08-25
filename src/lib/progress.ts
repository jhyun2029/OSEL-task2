import type { PlanStep, Task } from "@prisma/client";

/**
 * Effective progress percentage for a task.
 *
 * Rule (PRD §4.3): a manually-entered progressPercent always wins. Otherwise,
 * if the task has plan steps, progress is derived from the completed-step
 * ratio. A task with neither a manual value nor plan steps falls back to
 * 0% (PLANNED/IN_PROGRESS/ON_HOLD/DELAYED) or 100% (DONE).
 */
export function computeProgress(
  task: Pick<Task, "progressPercent" | "status">,
  planSteps: Pick<PlanStep, "isDone">[]
): number {
  if (task.progressPercent !== null && task.progressPercent !== undefined) {
    return clamp(task.progressPercent);
  }

  if (planSteps.length > 0) {
    const done = planSteps.filter((s) => s.isDone).length;
    return clamp(Math.round((done / planSteps.length) * 100));
  }

  return task.status === "DONE" ? 100 : 0;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

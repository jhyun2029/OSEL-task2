import type { Importance, TaskStatus } from "@/lib/enums";
import {
  IMPORTANCE_BADGE_CLASS,
  IMPORTANCE_LABELS,
  TASK_STATUS_BADGE_CLASS,
  TASK_STATUS_LABELS,
} from "@/lib/constants";

export function ImportanceBadge({ value }: { value: Importance }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${IMPORTANCE_BADGE_CLASS[value]}`}
    >
      {IMPORTANCE_LABELS[value]}
    </span>
  );
}

export function StatusBadge({ value }: { value: TaskStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TASK_STATUS_BADGE_CLASS[value]}`}
    >
      {TASK_STATUS_LABELS[value]}
    </span>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-full min-w-16 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-900 transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-9 shrink-0 text-right text-xs tabular-nums text-slate-500">
        {value}%
      </span>
    </div>
  );
}

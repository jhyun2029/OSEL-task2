import type { ActivityType, Importance, TaskStatus, Visibility } from "@/lib/enums";

// Central place for label/color mapping so pages and API routes agree on
// display strings. Keeping this in one file also makes it obvious what a
// future i18n pass would need to touch.

export const IMPORTANCE_LABELS: Record<Importance, string> = {
  URGENT: "긴급",
  HIGH: "높음",
  NORMAL: "보통",
  LOW: "낮음",
};

export const IMPORTANCE_ORDER: Importance[] = ["URGENT", "HIGH", "NORMAL", "LOW"];

export const IMPORTANCE_BADGE_CLASS: Record<Importance, string> = {
  URGENT: "bg-red-100 text-red-700 border border-red-200",
  HIGH: "bg-orange-100 text-orange-700 border border-orange-200",
  NORMAL: "bg-blue-100 text-blue-700 border border-blue-200",
  LOW: "bg-slate-100 text-slate-600 border border-slate-200",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  PLANNED: "예정",
  IN_PROGRESS: "진행중",
  ON_HOLD: "보류",
  DELAYED: "지연",
  DONE: "완료",
};

export const TASK_STATUS_ORDER: TaskStatus[] = [
  "PLANNED",
  "IN_PROGRESS",
  "ON_HOLD",
  "DELAYED",
  "DONE",
];

export const TASK_STATUS_BADGE_CLASS: Record<TaskStatus, string> = {
  PLANNED: "bg-slate-100 text-slate-600 border border-slate-200",
  IN_PROGRESS: "bg-blue-100 text-blue-700 border border-blue-200",
  ON_HOLD: "bg-amber-100 text-amber-700 border border-amber-200",
  DELAYED: "bg-red-100 text-red-700 border border-red-200",
  DONE: "bg-green-100 text-green-700 border border-green-200",
};

export const VISIBILITY_LABELS: Record<Visibility, string> = {
  PRIVATE: "개인 전용",
  TEAM_SHARED: "팀 공유 (준비 중)",
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  CREATED: "업무 생성",
  STATUS_CHANGED: "상태 변경",
  PROGRESS_CHANGED: "진행률 변경",
  PLAN_STEP_ADDED: "단계 추가",
  PLAN_STEP_COMPLETED: "단계 완료",
  PLAN_STEP_REOPENED: "단계 재오픈",
  UPDATED: "내용 수정",
};

// The MVP has no auth yet (see TODO.md). Everything is scoped to this one
// seeded user so the data model already has an ownerId to build
// multi-user/team support on top of later.
export const DEFAULT_USER_EMAIL = "researcher@example.com";

// Single source of truth for the MVP's "enum-like" string fields.
//
// SQLite (Prisma's `datasource` here) has no native enum type, so these
// columns are plain Strings at the DB layer (see prisma/schema.prisma).
// Application code enforces the value set instead: zod validation
// (lib/validation.ts) uses the same arrays, and every UI/API import of
// these types should come from this file rather than "@prisma/client".

export const IMPORTANCE_VALUES = ["URGENT", "HIGH", "NORMAL", "LOW"] as const;
export type Importance = (typeof IMPORTANCE_VALUES)[number];

export const TASK_STATUS_VALUES = [
  "PLANNED",
  "IN_PROGRESS",
  "ON_HOLD",
  "DELAYED",
  "DONE",
] as const;
export type TaskStatus = (typeof TASK_STATUS_VALUES)[number];

export const VISIBILITY_VALUES = ["PRIVATE", "TEAM_SHARED"] as const;
export type Visibility = (typeof VISIBILITY_VALUES)[number];

export const ACTIVITY_TYPE_VALUES = [
  "CREATED",
  "STATUS_CHANGED",
  "PROGRESS_CHANGED",
  "PLAN_STEP_ADDED",
  "PLAN_STEP_COMPLETED",
  "PLAN_STEP_REOPENED",
  "UPDATED",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPE_VALUES)[number];

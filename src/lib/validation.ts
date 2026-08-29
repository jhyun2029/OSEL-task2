import { z } from "zod";
import {
  IMPORTANCE_VALUES,
  TASK_STATUS_VALUES,
  VISIBILITY_VALUES,
} from "@/lib/enums";

// Value sets come from lib/enums.ts (the single source of truth — SQLite
// stores these as plain strings, see prisma/schema.prisma) so validation
// can never drift from what the UI/DB actually allow.
export const importanceEnum = z.enum(IMPORTANCE_VALUES);
export const taskStatusEnum = z.enum(TASK_STATUS_VALUES);
export const visibilityEnum = z.enum(VISIBILITY_VALUES);

// dates arrive from <input type="date"> / JSON as "YYYY-MM-DD" or full ISO.
const dateLike = z
  .string()
  .min(1)
  .transform((v) => new Date(v))
  .refine((d) => !Number.isNaN(d.getTime()), { message: "Invalid date" });

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력하세요").max(200),
  description: z.string().trim().max(5000).optional().nullable(),
  tags: z.string().trim().max(500).optional().nullable(),
  projectId: z.string().min(1).optional().nullable(),
  importance: importanceEnum.default("NORMAL"),
  status: taskStatusEnum.default("PLANNED"),
  // 팀 공유가 기본값: 연구실 멤버 모두가 서로의 업무를 보는 것이 기본이고,
  // 민감한 업무만 명시적으로 PRIVATE(개인 전용)으로 만든다.
  visibility: visibilityEnum.default("TEAM_SHARED"),
  startDate: dateLike.optional().nullable(),
  dueDate: dateLike.optional().nullable(),
  progressPercent: z.number().int().min(0).max(100).optional().nullable(),
  planSteps: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(200),
        plannedStartDate: dateLike.optional().nullable(),
        plannedEndDate: dateLike.optional().nullable(),
      })
    )
    .optional()
    .default([]),
});

// createTaskSchema.partial()을 그대로 쓰면 importance/status/visibility의
// .default()가 부분 업데이트에도 값을 채워 넣어, 클라이언트가 보내지 않은
// 필드까지 "수정됨"으로 기록되는 문제가 있다(활동 이력 중복). default 없이
// 전 필드 optional로 명시한다.
export const updateTaskSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력하세요").max(200).optional(),
  description: z.string().trim().max(5000).optional().nullable(),
  tags: z.string().trim().max(500).optional().nullable(),
  projectId: z.string().min(1).optional().nullable(),
  importance: importanceEnum.optional(),
  status: taskStatusEnum.optional(),
  visibility: visibilityEnum.optional(),
  startDate: dateLike.optional().nullable(),
  dueDate: dateLike.optional().nullable(),
  progressPercent: z.number().int().min(0).max(100).optional().nullable(),
});

export const createPlanStepSchema = z.object({
  title: z.string().trim().min(1).max(200),
  plannedStartDate: dateLike.optional().nullable(),
  plannedEndDate: dateLike.optional().nullable(),
});

// 드래그 정렬: 해당 업무의 전체 단계 id를 새 순서대로 나열한 배열.
export const reorderPlanStepsSchema = z.object({
  order: z.array(z.string().min(1)).min(1),
});

export const updatePlanStepSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  isDone: z.boolean().optional(),
  plannedStartDate: dateLike.optional().nullable(),
  plannedEndDate: dateLike.optional().nullable(),
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "프로젝트명을 입력하세요").max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  color: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{6})$/)
    .optional()
    .nullable(),
});

export const updateProjectSchema = createProjectSchema.partial();

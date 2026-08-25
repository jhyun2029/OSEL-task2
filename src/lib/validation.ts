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
  visibility: visibilityEnum.default("PRIVATE"),
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

export const updateTaskSchema = createTaskSchema
  .omit({ planSteps: true })
  .partial();

export const createPlanStepSchema = z.object({
  title: z.string().trim().min(1).max(200),
  plannedStartDate: dateLike.optional().nullable(),
  plannedEndDate: dateLike.optional().nullable(),
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

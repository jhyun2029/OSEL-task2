import type { Prisma } from "@prisma/client";
import type { ActivityType } from "@/lib/enums";

/** Shared shape for writing one ActivityLog row, used from API routes. */
export function activityEntry(
  taskId: string,
  actorId: string,
  type: ActivityType,
  message: string,
  metadata?: Record<string, unknown>
): Prisma.ActivityLogCreateManyInput {
  return {
    taskId,
    actorId,
    type,
    message,
    metadata: metadata ? JSON.stringify(metadata) : null,
  };
}

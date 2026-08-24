import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { updatePlanStepSchema } from "@/lib/validation";
import { activityEntry } from "@/lib/activity";

type Params = { params: Promise<{ id: string; stepId: string }> };

async function loadOwnedStep(taskId: string, stepId: string, ownerId: string) {
  return prisma.planStep.findFirst({
    where: { id: stepId, taskId, task: { ownerId } },
  });
}

// PATCH /api/tasks/:id/plan-steps/:stepId — edit a step or toggle isDone.
// Toggling isDone also nudges the task's status: PLANNED -> IN_PROGRESS on
// the first step completed, and DONE once every step is complete (unless
// the task already has a manual progressPercent, whose owner presumably
// wants full control).
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id: taskId, stepId } = await params;
  const user = await getCurrentUser();
  const existing = await loadOwnedStep(taskId, stepId, user.id);
  if (!existing) {
    return NextResponse.json({ error: "Plan step not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updatePlanStepSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const step = await prisma.$transaction(async (tx) => {
    const updated = await tx.planStep.update({
      where: { id: stepId },
      data: {
        title: data.title ?? undefined,
        plannedStartDate:
          data.plannedStartDate !== undefined ? data.plannedStartDate : undefined,
        plannedEndDate:
          data.plannedEndDate !== undefined ? data.plannedEndDate : undefined,
        isDone: data.isDone ?? undefined,
        completedAt:
          data.isDone === undefined
            ? undefined
            : data.isDone
              ? new Date()
              : null,
      },
    });

    if (data.isDone !== undefined && data.isDone !== existing.isDone) {
      await tx.activityLog.create({
        data: activityEntry(
          taskId,
          user.id,
          data.isDone ? "PLAN_STEP_COMPLETED" : "PLAN_STEP_REOPENED",
          `단계 "${updated.title}"${data.isDone ? "이(가) 완료 처리되었습니다." : "이(가) 다시 진행중으로 표시되었습니다."}`
        ),
      });

      const siblings = await tx.planStep.findMany({ where: { taskId } });
      const task = await tx.task.findUniqueOrThrow({ where: { id: taskId } });
      const allDone = siblings.every((s) => s.isDone);

      if (task.progressPercent === null) {
        if (allDone && task.status !== "DONE") {
          await tx.task.update({
            where: { id: taskId },
            data: { status: "DONE" },
          });
          await tx.activityLog.create({
            data: activityEntry(
              taskId,
              user.id,
              "STATUS_CHANGED",
              "모든 단계가 완료되어 상태가 \"완료\"로 자동 변경되었습니다.",
              { from: task.status, to: "DONE" }
            ),
          });
        } else if (!allDone && task.status === "PLANNED") {
          await tx.task.update({
            where: { id: taskId },
            data: { status: "IN_PROGRESS" },
          });
          await tx.activityLog.create({
            data: activityEntry(
              taskId,
              user.id,
              "STATUS_CHANGED",
              "단계 진행이 시작되어 상태가 \"진행중\"으로 자동 변경되었습니다.",
              { from: task.status, to: "IN_PROGRESS" }
            ),
          });
        } else if (!allDone && task.status === "DONE") {
          await tx.task.update({
            where: { id: taskId },
            data: { status: "IN_PROGRESS" },
          });
        }
      }
    }

    return updated;
  });

  return NextResponse.json(step);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id: taskId, stepId } = await params;
  const user = await getCurrentUser();
  const existing = await loadOwnedStep(taskId, stepId, user.id);
  if (!existing) {
    return NextResponse.json({ error: "Plan step not found" }, { status: 404 });
  }
  await prisma.planStep.delete({ where: { id: stepId } });
  return NextResponse.json({ ok: true });
}

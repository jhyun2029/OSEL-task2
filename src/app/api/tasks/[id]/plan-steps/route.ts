import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { createPlanStepSchema } from "@/lib/validation";
import { activityEntry } from "@/lib/activity";

type Params = { params: Promise<{ id: string }> };

// POST /api/tasks/:id/plan-steps — append a new plan step (order = end of list).
export async function POST(req: NextRequest, { params }: Params) {
  const { id: taskId } = await params;
  const user = await getCurrentUser();
  const task = await prisma.task.findFirst({
    where: { id: taskId, ownerId: user.id },
  });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createPlanStepSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const maxOrder = await prisma.planStep.aggregate({
    where: { taskId },
    _max: { order: true },
  });

  const step = await prisma.$transaction(async (tx) => {
    const created = await tx.planStep.create({
      data: {
        taskId,
        title: parsed.data.title,
        order: (maxOrder._max.order ?? -1) + 1,
        plannedStartDate: parsed.data.plannedStartDate ?? null,
        plannedEndDate: parsed.data.plannedEndDate ?? null,
      },
    });
    await tx.activityLog.create({
      data: activityEntry(
        taskId,
        user.id,
        "PLAN_STEP_ADDED",
        `단계 "${created.title}"이(가) 추가되었습니다.`
      ),
    });
    return created;
  });

  return NextResponse.json(step, { status: 201 });
}

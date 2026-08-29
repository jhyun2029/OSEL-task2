import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { createPlanStepSchema, reorderPlanStepsSchema } from "@/lib/validation";
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

// PATCH /api/tasks/:id/plan-steps — reorder steps (drag & drop).
// body: { order: [stepId, ...] } — 해당 업무의 전체 단계 id를 새 순서대로.
// 순서 변경은 내용 변경이 아니므로 활동 이력은 남기지 않는다.
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id: taskId } = await params;
  const user = await getCurrentUser();
  const task = await prisma.task.findFirst({
    where: { id: taskId, ownerId: user.id },
  });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = reorderPlanStepsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const steps = await prisma.planStep.findMany({
    where: { taskId },
    select: { id: true },
  });
  const existingIds = new Set(steps.map((s) => s.id));
  const requested = parsed.data.order;
  if (
    requested.length !== existingIds.size ||
    !requested.every((id) => existingIds.has(id))
  ) {
    return NextResponse.json(
      { error: "order must contain exactly the task's plan step ids" },
      { status: 400 }
    );
  }

  await prisma.$transaction(
    requested.map((stepId, index) =>
      prisma.planStep.update({ where: { id: stepId }, data: { order: index } })
    )
  );

  return NextResponse.json({ ok: true });
}

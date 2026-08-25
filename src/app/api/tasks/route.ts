import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { createTaskSchema } from "@/lib/validation";
import { taskInclude, toTaskDto, type TaskWithRelations } from "@/lib/task-dto";
import { activityEntry } from "@/lib/activity";
import type { Prisma } from "@prisma/client";
import type { Importance, TaskStatus } from "@/lib/enums";

// GET /api/tasks?status=&importance=&projectId=&from=&to=
// `from`/`to` filter tasks whose [startDate, dueDate] range overlaps the
// given window — this is what the calendar view uses to fetch a visible
// range, and the list/to-do view calls it with no range for "all tasks".
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(req.url);

  const status = searchParams.get("status");
  const importance = searchParams.get("importance");
  const projectId = searchParams.get("projectId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Prisma.TaskWhereInput = { ownerId: user.id };
  if (status) where.status = status as TaskStatus;
  if (importance) where.importance = importance as Importance;
  if (projectId) where.projectId = projectId;

  if (from || to) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    where.AND = [
      fromDate ? { OR: [{ dueDate: { gte: fromDate } }, { dueDate: null }] } : {},
      toDate ? { OR: [{ startDate: { lte: toDate } }, { startDate: null }] } : {},
    ];
  }

  const tasks = (await prisma.task.findMany({
    where,
    include: taskInclude,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  })) as TaskWithRelations[];

  return NextResponse.json(tasks.map(toTaskDto));
}

// POST /api/tasks — create a task, optionally seeded with plan steps.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const body = await req.json().catch(() => null);
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { planSteps, ...data } = parsed.data;

  const task = await prisma.$transaction(async (tx) => {
    const created = await tx.task.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        tags: data.tags ?? null,
        importance: data.importance,
        status: data.status,
        visibility: data.visibility,
        startDate: data.startDate ?? null,
        dueDate: data.dueDate ?? null,
        progressPercent: data.progressPercent ?? null,
        ownerId: user.id,
        projectId: data.projectId ?? null,
        planSteps: planSteps?.length
          ? {
              create: planSteps.map((s, i) => ({
                title: s.title,
                order: i,
                plannedStartDate: s.plannedStartDate ?? null,
                plannedEndDate: s.plannedEndDate ?? null,
              })),
            }
          : undefined,
      },
    });

    await tx.activityLog.create({
      data: activityEntry(
        created.id,
        user.id,
        "CREATED",
        `"${created.title}" 업무가 생성되었습니다.`
      ),
    });

    return tx.task.findUniqueOrThrow({
      where: { id: created.id },
      include: taskInclude,
    });
  });

  return NextResponse.json(toTaskDto(task as TaskWithRelations), {
    status: 201,
  });
}

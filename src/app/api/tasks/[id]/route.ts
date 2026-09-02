import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { updateTaskSchema } from "@/lib/validation";
import { taskInclude, toTaskDto, type TaskWithRelations } from "@/lib/task-dto";
import { activityEntry } from "@/lib/activity";
import { TASK_STATUS_LABELS } from "@/lib/constants";
import type { Prisma } from "@prisma/client";
import type { TaskStatus } from "@/lib/enums";

type Params = { params: Promise<{ id: string }> };

async function loadOwnedTask(id: string, ownerId: string) {
  const task = await prisma.task.findFirst({ where: { id, ownerId } });
  return task;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getCurrentUser();
  // 조회는 팀 공유 규칙(내 것 전부 + 남의 TEAM_SHARED)을 따르고,
  // 수정/삭제(PATCH/DELETE)는 소유자만 가능하다(loadOwnedTask).
  const task = (await prisma.task.findFirst({
    where: {
      id,
      OR: [{ ownerId: user.id }, { visibility: "TEAM_SHARED" }],
    },
    include: taskInclude,
  })) as TaskWithRelations | null;

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  return NextResponse.json(toTaskDto(task));
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getCurrentUser();
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // 권한: 일반 수정은 소유자만. 소유자 이관(ownerId)은 관리자만 가능하며,
  // 남의 업무에 대해서는 이관 외의 수정을 허용하지 않는다.
  const isOwner = existing.ownerId === user.id;
  if (data.ownerId !== undefined && !user.isAdmin) {
    return NextResponse.json(
      { error: "소유자 이관은 관리자만 할 수 있습니다." },
      { status: 403 }
    );
  }
  if (!isOwner) {
    const keys = Object.keys(data).filter((k) => data[k as keyof typeof data] !== undefined);
    const onlyOwnerTransfer =
      user.isAdmin && keys.length === 1 && keys[0] === "ownerId";
    if (!onlyOwnerTransfer) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
  }
  if (data.ownerId !== undefined) {
    const target = await prisma.user.findUnique({ where: { id: data.ownerId } });
    if (!target) {
      return NextResponse.json(
        { error: "이관 대상 멤버를 찾을 수 없습니다." },
        { status: 400 }
      );
    }
  }

  const updateData: Prisma.TaskUpdateInput = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.importance !== undefined) updateData.importance = data.importance;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.visibility !== undefined) updateData.visibility = data.visibility;
  if (data.startDate !== undefined) updateData.startDate = data.startDate;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
  if (data.progressPercent !== undefined)
    updateData.progressPercent = data.progressPercent;
  if (data.ownerId !== undefined && data.ownerId !== existing.ownerId) {
    updateData.owner = { connect: { id: data.ownerId } };
  }
  if (data.projectId !== undefined) {
    updateData.project = data.projectId
      ? { connect: { id: data.projectId } }
      : { disconnect: true };
  }

  const task = await prisma.$transaction(async (tx) => {
    await tx.task.update({ where: { id }, data: updateData });

    if (data.status !== undefined && data.status !== existing.status) {
      await tx.activityLog.create({
        data: activityEntry(
          id,
          user.id,
          "STATUS_CHANGED",
          `상태가 "${TASK_STATUS_LABELS[existing.status as TaskStatus]}"에서 "${TASK_STATUS_LABELS[data.status]}"(으)로 변경되었습니다.`,
          { from: existing.status, to: data.status }
        ),
      });
    }

    if (
      data.progressPercent !== undefined &&
      data.progressPercent !== existing.progressPercent
    ) {
      await tx.activityLog.create({
        data: activityEntry(
          id,
          user.id,
          "PROGRESS_CHANGED",
          `진행률이 ${data.progressPercent}%로 변경되었습니다.`,
          { from: existing.progressPercent, to: data.progressPercent }
        ),
      });
    }

    if (data.ownerId !== undefined && data.ownerId !== existing.ownerId) {
      const [from, to] = await Promise.all([
        tx.user.findUnique({ where: { id: existing.ownerId } }),
        tx.user.findUnique({ where: { id: data.ownerId } }),
      ]);
      await tx.activityLog.create({
        data: activityEntry(
          id,
          user.id,
          "UPDATED",
          `담당자가 "${from?.name ?? "?"}"에서 "${to?.name ?? "?"}"(으)로 이관되었습니다.`,
          { from: existing.ownerId, to: data.ownerId }
        ),
      });
    }

    const hasOtherFieldChange = Object.keys(updateData).some(
      (k) => k !== "status" && k !== "progressPercent" && k !== "owner"
    );
    if (hasOtherFieldChange) {
      await tx.activityLog.create({
        data: activityEntry(id, user.id, "UPDATED", "업무 내용이 수정되었습니다."),
      });
    }

    return tx.task.findUniqueOrThrow({ where: { id }, include: taskInclude });
  });

  return NextResponse.json(toTaskDto(task as TaskWithRelations));
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getCurrentUser();
  const existing = await loadOwnedTask(id, user.id);
  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

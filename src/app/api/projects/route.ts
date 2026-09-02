import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { createProjectSchema, reorderIdsSchema } from "@/lib/validation";

// 프로젝트는 팀 공용: 모든 멤버가 같은 목록을 공유한다 (ownerId는 생성자 기록용).
export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { tasks: true } } },
  });
  return NextResponse.json(projects);
}

// PATCH /api/projects — 프로젝트 목록 드래그 정렬. body: { order: [id, ...] }
export async function PATCH(req: NextRequest) {
  await getCurrentUser(); // 게이트 통과한 멤버 누구나 (팀 공용 순서)
  const body = await req.json().catch(() => null);
  const parsed = reorderIdsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const ids = parsed.data.order;
  const all = await prisma.project.findMany({ select: { id: true } });
  const existing = new Set(all.map((p) => p.id));
  if (ids.length !== existing.size || !ids.every((id) => existing.has(id))) {
    return NextResponse.json(
      { error: "order는 전체 프로젝트 id를 정확히 포함해야 합니다." },
      { status: 400 }
    );
  }
  await prisma.$transaction(
    ids.map((id, i) =>
      prisma.project.update({ where: { id }, data: { sortOrder: i } })
    )
  );
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const body = await req.json().catch(() => null);
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const maxSort = await prisma.project.aggregate({ _max: { sortOrder: true } });
  const project = await prisma.project.create({
    data: {
      ...parsed.data,
      ownerId: user.id,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });
  return NextResponse.json(project, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { updateProjectSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

// 프로젝트는 팀 공용: 수정/삭제는 만든 사람 본인 또는 관리자가 할 수 있다.
async function loadEditable(id: string, user: { id: string; isAdmin: boolean }) {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return null;
  if (!user.isAdmin && project.ownerId !== user.id) return "forbidden";
  return project;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getCurrentUser();
  const existing = await loadEditable(id, user);
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (existing === "forbidden") {
    return NextResponse.json(
      { error: "프로젝트를 만든 멤버 또는 관리자만 수정할 수 있습니다." },
      { status: 403 }
    );
  }
  const body = await req.json().catch(() => null);
  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const project = await prisma.project.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json(project);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getCurrentUser();
  const existing = await loadEditable(id, user);
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (existing === "forbidden") {
    return NextResponse.json(
      { error: "프로젝트를 만든 멤버 또는 관리자만 삭제할 수 있습니다." },
      { status: 403 }
    );
  }
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

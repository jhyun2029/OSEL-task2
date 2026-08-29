import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { createProjectSchema } from "@/lib/validation";

// 프로젝트는 팀 공용: 모든 멤버가 같은 목록을 공유한다 (ownerId는 생성자 기록용).
export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { tasks: true } } },
  });
  return NextResponse.json(projects);
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
  const project = await prisma.project.create({
    data: { ...parsed.data, ownerId: user.id },
  });
  return NextResponse.json(project, { status: 201 });
}

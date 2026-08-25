import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { createProjectSchema } from "@/lib/validation";

export async function GET() {
  const user = await getCurrentUser();
  const projects = await prisma.project.findMany({
    where: { ownerId: user.id },
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

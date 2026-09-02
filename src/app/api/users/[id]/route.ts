import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

type Params = { params: Promise<{ id: string }> };

// DELETE /api/users/:id — 멤버 삭제. 전체 관리자(isAdmin)만 가능하다.
// 스키마상 onDelete: Cascade라서 해당 멤버의 업무/프로젝트가 함께 삭제된다
// (클라이언트가 업무 수를 먼저 보여주고 확인을 받는다).
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const me = await getCurrentUser();

  if (!me.isAdmin) {
    return NextResponse.json(
      { error: "멤버 삭제는 관리자만 할 수 있습니다." },
      { status: 403 }
    );
  }
  if (id === me.id) {
    return NextResponse.json(
      { error: "자기 자신(관리자)은 삭제할 수 없습니다." },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      isAdmin: true,
      _count: { select: { tasks: true } },
    },
  });
  if (!target) {
    return NextResponse.json({ error: "멤버를 찾을 수 없습니다." }, { status: 404 });
  }
  if (target.isAdmin) {
    return NextResponse.json(
      { error: "관리자 계정은 삭제할 수 없습니다." },
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true, deletedTasks: target._count.tasks });
}

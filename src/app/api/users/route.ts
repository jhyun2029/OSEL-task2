import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { reorderIdsSchema } from "@/lib/validation";

// GET /api/users — 멤버(연구원) 목록. 이름 선택 로그인과 필터에 쓰인다.
export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, isAdmin: true },
  });
  return NextResponse.json(users);
}

// PATCH /api/users — 멤버 목록 드래그 정렬 (관리자 전용).
export async function PATCH(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me.isAdmin) {
    return NextResponse.json(
      { error: "멤버 순서 변경은 관리자만 할 수 있습니다." },
      { status: 403 }
    );
  }
  const body = await req.json().catch(() => null);
  const parsed = reorderIdsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const ids = parsed.data.order;
  const all = await prisma.user.findMany({ select: { id: true } });
  const existing = new Set(all.map((u) => u.id));
  if (ids.length !== existing.size || !ids.every((id) => existing.has(id))) {
    return NextResponse.json(
      { error: "order는 전체 멤버 id를 정확히 포함해야 합니다." },
      { status: 400 }
    );
  }
  await prisma.$transaction(
    ids.map((id, i) =>
      prisma.user.update({ where: { id }, data: { sortOrder: i } })
    )
  );
  return NextResponse.json({ ok: true });
}

const createUserSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력하세요").max(50),
});

// POST /api/users — 새 멤버 추가 (신뢰 기반이라 누구나 추가 가능).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const name = parsed.data.name;
  const duplicate = await prisma.user.findFirst({ where: { name } });
  if (duplicate) {
    return NextResponse.json(
      { error: "같은 이름의 멤버가 이미 있습니다." },
      { status: 409 }
    );
  }

  // 이메일 로그인은 아직 없으므로 unique 제약을 채우기 위한 자리표시 값.
  const maxSort = await prisma.user.aggregate({ _max: { sortOrder: true } });
  const user = await prisma.user.create({
    data: {
      name,
      email: `member-${crypto.randomUUID()}@lab.local`,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
    select: { id: true, name: true, isAdmin: true },
  });
  return NextResponse.json(user, { status: 201 });
}

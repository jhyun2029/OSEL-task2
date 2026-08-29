import { NextRequest, NextResponse } from "next/server";

// POST /api/gate — 접속 코드 확인. 일치하면 180일짜리 httpOnly 쿠키를 심는다.
export async function POST(req: NextRequest) {
  const code = process.env.ACCESS_CODE;
  if (!code) return NextResponse.json({ ok: true });

  const body = await req.json().catch(() => null);
  if (typeof body?.code !== "string" || body.code !== code) {
    return NextResponse.json(
      { error: "접속 코드가 올바르지 않습니다." },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("access", code, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  return res;
}

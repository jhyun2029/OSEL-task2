import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 공유 접속 코드 게이트. 외부 공개 운영 시 무인증 접근(스캐너/외부인)을
 * 막기 위한 최소한의 보호막이다. .env의 ACCESS_CODE와 일치하는 값을 가진
 * 쿠키가 있어야 앱(페이지/API 모두)에 접근할 수 있고, 없으면 /gate로
 * 보내 코드를 한 번 입력하게 한다. ACCESS_CODE를 비워두면 게이트가 꺼진다.
 */
export function proxy(req: NextRequest) {
  const code = process.env.ACCESS_CODE;
  if (!code) return NextResponse.next();

  if (req.cookies.get("access")?.value === code) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (pathname === "/gate" || pathname === "/api/gate") {
    return NextResponse.next();
  }
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "access code required" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/gate";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // 정적 리소스는 게이트를 통과시켜 /gate 화면 렌더링이 막히지 않게 한다.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

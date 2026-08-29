import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_EMAIL } from "@/lib/constants";

/**
 * 연구실 규모의 신뢰 기반 "이름 선택" 방식 사용자 식별.
 * 비밀번호 없이 NavBar에서 멤버를 선택하면 `uid` 쿠키에 저장되고,
 * 서버는 그 쿠키로 현재 사용자를 결정한다. (실제 인증은 v1.1+ 로드맵)
 * 쿠키가 없거나 유효하지 않으면 기본 사용자로 폴백한다.
 */
export async function getCurrentUser() {
  const store = await cookies();
  const uid = store.get("uid")?.value;
  if (uid) {
    const selected = await prisma.user.findUnique({ where: { id: uid } });
    if (selected) return selected;
  }

  const fallback = await prisma.user.findUnique({
    where: { email: DEFAULT_USER_EMAIL },
  });
  if (fallback) return fallback;

  const first = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (first) return first;

  return prisma.user.create({
    data: {
      email: DEFAULT_USER_EMAIL,
      name: "연구원",
    },
  });
}

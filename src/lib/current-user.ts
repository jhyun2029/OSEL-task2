import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_EMAIL } from "@/lib/constants";

/**
 * MVP stand-in for auth (see TODO.md — real auth/session is out of scope
 * for this pass). Every request is scoped to a single seeded user so the
 * rest of the app can already treat "current user" as a first-class
 * concept, ready to be swapped for a real session lookup later.
 */
export async function getCurrentUser() {
  const existing = await prisma.user.findUnique({
    where: { email: DEFAULT_USER_EMAIL },
  });
  if (existing) return existing;

  return prisma.user.create({
    data: {
      email: DEFAULT_USER_EMAIL,
      name: "연구원",
    },
  });
}

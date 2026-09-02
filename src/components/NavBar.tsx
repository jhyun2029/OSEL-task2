"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserDto } from "@/lib/types";
import UserPicker from "@/components/UserPicker";
import Clock from "@/components/Clock";

const LINKS = [
  { href: "/tasks", label: "할 일 목록" },
  { href: "/calendar", label: "캘린더" },
  { href: "/projects", label: "프로젝트" },
];

export default function NavBar({
  users,
  currentUserId,
  isAdmin,
}: {
  users: UserDto[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const links = isAdmin
    ? [...LINKS, { href: "/members", label: "멤버 관리" }]
    : LINKS;

  // 접속 코드 입력 화면에서는 멤버 이름 등이 노출되지 않게 내비게이션을 숨긴다.
  if (pathname === "/gate") return null;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-baseline gap-3">
          <Link href="/tasks" className="text-lg font-semibold text-slate-900">
            연구원 업무 관리
          </Link>
          <Clock />
        </div>
        <div className="flex items-center gap-4">
          <nav className="flex gap-1">
            {links.map((link) => {
              const active = pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <UserPicker users={users} currentUserId={currentUserId} />
        </div>
      </div>
    </header>
  );
}

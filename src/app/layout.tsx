import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import NavBar from "@/components/NavBar";
import { getCurrentUser } from "@/lib/current-user";
import { listUsers } from "@/lib/data";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "연구원 업무 관리",
  description: "연구원 업무 관리 및 스케줄링 서비스 (MVP)",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [currentUser, users] = await Promise.all([getCurrentUser(), listUsers()]);
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <NavBar users={users} currentUserId={currentUser.id} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}

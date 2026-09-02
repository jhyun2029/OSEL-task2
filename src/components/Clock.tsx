"use client";

import { useEffect, useState } from "react";

// NavBar용 실시간 시계 (초 단위). 서버 렌더 시점과 클라이언트 시각이 달라
// hydration 불일치가 나지 않도록, 마운트 후에만 표시한다.
export default function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!now) return null;

  const date = now.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
  const time = now.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <span className="hidden text-xs tabular-nums text-slate-500 md:inline">
      {date} {time}
    </span>
  );
}

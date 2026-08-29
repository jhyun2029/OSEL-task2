"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ko } from "date-fns/locale";
import type { TaskDto, UserDto } from "@/lib/types";
import { isTaskOnDay } from "@/lib/calendar";
import { ImportanceBadge, StatusBadge } from "@/components/Badges";
import { TASK_STATUS_LABELS, TASK_STATUS_ORDER } from "@/lib/constants";

type ViewMode = "month" | "week" | "day" | "list";

const WEEK_STARTS_ON = 0; // Sunday
const ALL = "ALL";

export default function CalendarClient({
  tasks: allTasks,
  users,
  currentUserId,
}: {
  tasks: TaskDto[];
  users: UserDto[];
  currentUserId: string;
}) {
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [ownerFilter, setOwnerFilter] = useState<string>(ALL);

  const tasks = useMemo(
    () =>
      ownerFilter === ALL
        ? allTasks
        : allTasks.filter((t) => t.ownerId === ownerFilter),
    [allTasks, ownerFilter]
  );

  const title = useMemo(() => {
    if (view === "month") return format(cursor, "yyyy년 M월", { locale: ko });
    if (view === "week") {
      const start = startOfWeek(cursor, { weekStartsOn: WEEK_STARTS_ON });
      const end = endOfWeek(cursor, { weekStartsOn: WEEK_STARTS_ON });
      return `${format(start, "M/d", { locale: ko })} - ${format(end, "M/d", { locale: ko })}`;
    }
    if (view === "day") return format(cursor, "yyyy년 M월 d일 (EEE)", { locale: ko });
    return "전체 할 일";
  }, [view, cursor]);

  function step(dir: 1 | -1) {
    if (view === "month") setCursor((d) => addMonths(d, dir));
    else if (view === "week") setCursor((d) => addWeeks(d, dir));
    else if (view === "day") setCursor((d) => addDays(d, dir));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {view !== "list" && (
            <>
              <button onClick={() => step(-1)} className={NAV_BTN}>
                ‹
              </button>
              <button onClick={() => setCursor(new Date())} className={NAV_BTN}>
                오늘
              </button>
              <button onClick={() => step(1)} className={NAV_BTN}>
                ›
              </button>
            </>
          )}
          <h2 className="ml-2 text-base font-semibold text-slate-800">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            연구원
            <select
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
            >
              <option value={ALL}>전체</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.id === currentUserId ? `${u.name} (나)` : u.name}
                </option>
              ))}
            </select>
          </label>
        <div className="flex gap-1 rounded-md border border-slate-200 bg-white p-1">
          {(["month", "week", "day", "list"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded px-2.5 py-1 text-xs font-medium ${
                view === v ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {{ month: "월", week: "주", day: "일", list: "리스트" }[v]}
            </button>
          ))}
        </div>
        </div>
      </div>

      {view === "month" && <MonthView cursor={cursor} tasks={tasks} />}
      {view === "week" && <WeekView cursor={cursor} tasks={tasks} />}
      {view === "day" && <DayView cursor={cursor} tasks={tasks} />}
      {view === "list" && <ListView tasks={tasks} />}
    </div>
  );
}

const NAV_BTN =
  "rounded-md border border-slate-300 bg-white px-2.5 py-1 text-sm text-slate-700 hover:bg-slate-100";

function MonthView({ cursor, tasks }: { cursor: Date; tasks: TaskDto[] }) {
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: WEEK_STARTS_ON });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: WEEK_STARTS_ON });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-medium text-slate-500">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayTasks = tasks.filter((t) => isTaskOnDay(t, day));
          return (
            <div
              key={day.toISOString()}
              className={`min-h-24 border-b border-r border-slate-100 p-1.5 last:border-r-0 ${
                isSameMonth(day, cursor) ? "" : "bg-slate-50/60 text-slate-400"
              }`}
            >
              <div
                className={`mb-1 inline-flex size-5 items-center justify-center rounded-full text-xs ${
                  isToday(day) ? "bg-slate-900 text-white" : ""
                }`}
              >
                {format(day, "d")}
              </div>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map((t) => (
                  <TaskChip key={t.id} task={t} />
                ))}
                {dayTasks.length > 3 && (
                  <p className="text-[10px] text-slate-400">+{dayTasks.length - 3}개 더보기</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ cursor, tasks }: { cursor: Date; tasks: TaskDto[] }) {
  const start = startOfWeek(cursor, { weekStartsOn: WEEK_STARTS_ON });
  const end = endOfWeek(cursor, { weekStartsOn: WEEK_STARTS_ON });
  const days = eachDayOfInterval({ start, end });

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day) => {
        const dayTasks = tasks.filter((t) => isTaskOnDay(t, day));
        return (
          <div
            key={day.toISOString()}
            className="min-h-40 rounded-lg border border-slate-200 bg-white p-2"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-slate-500">{format(day, "EEE", { locale: ko })}</span>
              <span
                className={`inline-flex size-5 items-center justify-center rounded-full text-xs ${
                  isToday(day) ? "bg-slate-900 text-white" : "text-slate-700"
                }`}
              >
                {format(day, "d")}
              </span>
            </div>
            <div className="space-y-1">
              {dayTasks.map((t) => (
                <TaskChip key={t.id} task={t} />
              ))}
              {dayTasks.length === 0 && <p className="text-[11px] text-slate-300">-</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayView({ cursor, tasks }: { cursor: Date; tasks: TaskDto[] }) {
  const dayTasks = tasks.filter((t) => isTaskOnDay(t, cursor));
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      {dayTasks.length === 0 ? (
        <p className="text-sm text-slate-400">이 날짜에 예정된 업무가 없습니다.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {dayTasks.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <Link href={`/tasks/${t.id}`} className="font-medium text-slate-900 hover:underline">
                  {t.title}
                </Link>
                <div className="mt-1 flex gap-1.5">
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {t.owner.name}
                  </span>
                  <ImportanceBadge value={t.importance} />
                  <StatusBadge value={t.status} />
                </div>
              </div>
              {t.project && <span className="text-xs text-slate-400">{t.project.name}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ListView({ tasks }: { tasks: TaskDto[] }) {
  const byStatus = TASK_STATUS_ORDER.map((status) => ({
    status,
    items: tasks.filter((t) => t.status === status),
  })).filter((g) => g.items.length > 0);

  if (byStatus.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        등록된 업무가 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {byStatus.map((group) => (
        <div key={group.status}>
          <h3 className="mb-2 text-sm font-semibold text-slate-600">
            {TASK_STATUS_LABELS[group.status]} ({group.items.length})
          </h3>
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
            {group.items.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 p-3">
                <div>
                  <Link href={`/tasks/${t.id}`} className="font-medium text-slate-900 hover:underline">
                    {t.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {t.owner.name}
                    </span>
                    <ImportanceBadge value={t.importance} />
                    {t.dueDate && (
                      <span className="text-xs text-slate-400">
                        마감 {format(new Date(t.dueDate), "yyyy-MM-dd")}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs tabular-nums text-slate-500">{t.progress}%</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function TaskChip({ task }: { task: TaskDto }) {
  return (
    <Link
      href={`/tasks/${task.id}`}
      className="block truncate rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700 hover:bg-slate-200"
      title={`${task.owner.name} · ${task.title}`}
    >
      <span className="text-slate-400">{task.owner.name}</span> {task.title}
    </Link>
  );
}

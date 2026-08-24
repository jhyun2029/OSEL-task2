import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import type { TaskDto } from "@/lib/types";

/**
 * True when `day` falls inside a task's [startDate, dueDate] span. Tasks
 * with only one of the two dates are treated as a single-day event on
 * whichever date is set; tasks with neither date never appear on the
 * calendar (they still show up in the list/to-do view).
 */
export function isTaskOnDay(task: TaskDto, day: Date): boolean {
  const start = task.startDate ? new Date(task.startDate) : null;
  const due = task.dueDate ? new Date(task.dueDate) : null;

  if (!start && !due) return false;
  const rangeStart = startOfDay(start ?? due!);
  const rangeEnd = endOfDay(due ?? start!);
  if (rangeStart > rangeEnd) return isWithinInterval(day, { start: rangeEnd, end: rangeStart });
  return isWithinInterval(day, { start: rangeStart, end: rangeEnd });
}

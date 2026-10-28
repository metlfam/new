import type { AppData, FocusSession } from "../types";
export const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const shift = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 12);
export function streaks(sessions: FocusSession[], now = new Date()) {
  const keys = new Set(
    sessions
      .filter((s) => s.status === "completed" && s.endedAt)
      .map((s) => dayKey(new Date(s.endedAt!))),
  );
  let cursor = keys.has(dayKey(now)) ? now : shift(now, -1);
  let current = 0;
  while (keys.has(dayKey(cursor))) {
    current++;
    cursor = shift(cursor, -1);
  }
  let best = 0;
  let count = 0;
  let previous = "";
  for (const key of [...keys].sort()) {
    const [y, m, d] = key.split("-").map(Number);
    const date = new Date(y, m - 1, d, 12);
    count = dayKey(shift(date, -1)) === previous ? count + 1 : 1;
    best = Math.max(best, count);
    previous = key;
  }
  return { current, best };
}
export function statistics(data: AppData, now = new Date()) {
  const finished = data.sessions.filter((s) => s.endedAt !== null);
  const today = finished.filter(
    (s) => dayKey(new Date(s.endedAt!)) === dayKey(now),
  );
  return {
    minutes: Math.floor(
      finished.reduce((n, s) => n + s.actualDurationSeconds, 0) / 60,
    ),
    completed: finished.filter((s) => s.status === "completed").length,
    todayMinutes: Math.floor(
      today.reduce((n, s) => n + s.actualDurationSeconds, 0) / 60,
    ),
    todaySessions: today.filter((s) => s.status === "completed").length,
    steps: data.tasks.reduce(
      (n, t) => n + t.steps.filter((s) => s.completed).length,
      0,
    ),
    tasks: data.tasks.filter((t) => t.status === "completed").length,
    ...streaks(data.sessions, now),
    week: Array.from({ length: 7 }, (_, i) => {
      const date = shift(now, i - 6);
      return {
        date,
        minutes: Math.floor(
          finished
            .filter((s) => dayKey(new Date(s.endedAt!)) === dayKey(date))
            .reduce((n, s) => n + s.actualDurationSeconds, 0) / 60,
        ),
      };
    }),
  };
}

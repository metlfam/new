import type { AppData, FocusSession, Task } from "../types";
import { id } from "./taskGenerator";
export function remaining(data: AppData, now = Date.now()) {
  const timer = data.activeTimer;
  if (!timer) return 0;
  const session = data.sessions.find((s) => s.id === timer.sessionId);
  if (!session) return 0;
  return Math.max(
    0,
    Math.min(
      session.plannedDurationSeconds - session.actualDurationSeconds,
      timer.remainingSecondsWhenPaused ??
        (Date.parse(timer.endsAt!) - now) / 1000,
    ),
  );
}
export function begin(
  data: AppData,
  task: Task,
  minutes: number,
  now = Date.now(),
): AppData {
  if (data.activeTimer) return data;
  const step = task.steps.find((s) => !s.completed);
  if (!step) return data;
  const session: FocusSession = {
    id: id(),
    taskId: task.id,
    stepId: step.id,
    taskTitle: task.title,
    stepTitle: step.title,
    plannedDurationSeconds: minutes * 60,
    actualDurationSeconds: 0,
    startedAt: new Date(now).toISOString(),
    endedAt: null,
    status: "active",
  };
  return {
    ...data,
    sessions: [...data.sessions, session],
    activeTimer: {
      sessionId: session.id,
      remainingSecondsWhenPaused: null,
      endsAt: new Date(now + minutes * 60000).toISOString(),
    },
  };
}
export function pause(
  data: AppData,
  now = Date.now(),
  forcedRemaining?: number,
): AppData {
  if (!data.activeTimer || data.activeTimer.remainingSecondsWhenPaused !== null)
    return data;
  const left = forcedRemaining ?? remaining(data, now);
  if (left <= 0) return data; // Let the running timer complete on its next tick.
  return {
    ...data,
    activeTimer: {
      ...data.activeTimer,
      endsAt: null,
      remainingSecondsWhenPaused: left,
    },
    sessions: data.sessions.map((s) =>
      s.id === data.activeTimer!.sessionId
        ? {
            ...s,
            status: "paused",
            actualDurationSeconds: s.plannedDurationSeconds - left,
          }
        : s,
    ),
  };
}
export function resume(data: AppData, now = Date.now()): AppData {
  if (!data.activeTimer || data.activeTimer.remainingSecondsWhenPaused === null)
    return data;
  return {
    ...data,
    activeTimer: {
      ...data.activeTimer,
      remainingSecondsWhenPaused: null,
      endsAt: new Date(now + remaining(data, now) * 1000).toISOString(),
    },
    sessions: data.sessions.map((s) =>
      s.id === data.activeTimer!.sessionId ? { ...s, status: "active" } : s,
    ),
  };
}
export function finish(
  data: AppData,
  sessionId: string,
  early = false,
  now = Date.now(),
): AppData {
  if (data.activeTimer?.sessionId !== sessionId) return data;
  const left = remaining(data, now);
  if (!early && left > 0) return data;
  const endedAt = early
    ? new Date(now).toISOString()
    : (data.activeTimer.endsAt ?? new Date(now).toISOString());
  return {
    ...data,
    activeTimer: null,
    sessions: data.sessions.map((s) =>
      s.id === sessionId
        ? {
            ...s,
            status: early && left > 0 ? "abandoned" : "completed",
            actualDurationSeconds: early
              ? s.plannedDurationSeconds - left
              : s.plannedDurationSeconds,
            endedAt,
          }
        : s,
    ),
  };
}

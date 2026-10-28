import { z } from "zod";
import type { AppData } from "../types";
const text = z.string().trim().min(1).max(200);
const key = z.string().min(1).max(150);
const date = z.iso.datetime();
const step = z
  .object({
    id: key,
    title: text,
    completed: z.boolean(),
    completedAt: date.nullable(),
  })
  .refine((s) => s.completed === (s.completedAt !== null));
const task = z
  .object({
    id: key,
    title: text,
    category: z.enum([
      "Учёба",
      "Уборка",
      "Работа",
      "Спорт",
      "Творчество",
      "Организация",
      "Личное",
    ]),
    steps: z.array(step).max(200),
    createdAt: date,
    updatedAt: date,
    completedAt: date.nullable(),
    status: z.enum(["active", "completed"]),
  })
  .refine(
    (t) =>
      new Set(t.steps.map((s) => s.id)).size === t.steps.length &&
      (t.status === "completed") ===
        (t.steps.length > 0 && t.steps.every((s) => s.completed)) &&
      (t.status === "completed") === (t.completedAt !== null),
  );
const session = z
  .object({
    id: key,
    taskId: key,
    stepId: key,
    taskTitle: text,
    stepTitle: text,
    plannedDurationSeconds: z.number().int().min(1).max(1500),
    actualDurationSeconds: z.number().min(0).max(1500),
    startedAt: date,
    endedAt: date.nullable(),
    status: z.enum(["active", "paused", "completed", "abandoned"]),
    outcome: z.enum(["done", "partial", "not-yet"]).optional(),
  })
  .refine(
    (s) =>
      s.actualDurationSeconds <= s.plannedDurationSeconds &&
      ["completed", "abandoned"].includes(s.status) === (s.endedAt !== null),
  );
const schema = z
  .object({
    version: z.literal(1),
    tasks: z.array(task).max(10000),
    sessions: z.array(session).max(100000),
    activeTimer: z
      .object({
        sessionId: key,
        remainingSecondsWhenPaused: z.number().min(0).max(1500).nullable(),
        endsAt: date.nullable(),
      })
      .nullable(),
    settings: z.object({
      theme: z.enum(["light", "dark", "system"]),
      soundEnabled: z.boolean(),
      defaultDurationMinutes: z.union([
        z.literal(2),
        z.literal(5),
        z.literal(10),
        z.literal(15),
        z.literal(25),
      ]),
    }),
  })
  .superRefine((d, ctx) => {
    const active = d.sessions.filter(
      (s) => s.status === "active" || s.status === "paused",
    );
    const timer = d.activeTimer;
    let ok =
      new Set(d.tasks.map((t) => t.id)).size === d.tasks.length &&
      new Set(d.sessions.map((s) => s.id)).size === d.sessions.length;
    if (!timer) ok &&= active.length === 0;
    else {
      const s = active[0];
      ok &&=
        active.length === 1 &&
        s.id === timer.sessionId &&
        d.tasks.some(
          (t) => t.id === s.taskId && t.steps.some((p) => p.id === s.stepId),
        );
      if (s)
        ok &&=
          s.status === "active"
            ? timer.endsAt !== null && timer.remainingSecondsWhenPaused === null
            : timer.endsAt === null &&
              timer.remainingSecondsWhenPaused !== null &&
              timer.remainingSecondsWhenPaused <= s.plannedDurationSeconds;
    }
    if (!ok)
      ctx.addIssue({
        code: "custom",
        message: "Несогласованное состояние данных",
      });
  });
export function parseData(raw: string): AppData {
  return schema.parse(JSON.parse(raw));
}

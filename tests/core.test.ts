import { describe, expect, it } from "vitest";
import {
  categoryFor,
  createTask,
  generateSteps,
  normalizeTask,
  progress,
} from "../src/lib/taskGenerator";
import { begin, finish, pause, remaining, resume } from "../src/lib/timer";
import { parseData } from "../src/lib/validation";
import { statistics, streaks } from "../src/lib/statistics";
import type { AppData, FocusSession } from "../src/types";
const fresh = (): AppData => ({
  version: 1,
  tasks: [createTask("Подготовиться к экзамену по физике")],
  sessions: [],
  activeTimer: null,
  settings: { theme: "system", soundEnabled: false, defaultDurationMinutes: 5 },
});
const now = new Date("2026-10-28T12:00:00Z").getTime();
const session = (
  day: number,
  status: FocusSession["status"] = "completed",
): FocusSession => ({
  id: `session-${day}`,
  taskId: "task",
  stepId: "step",
  taskTitle: "Задача",
  stepTitle: "Шаг",
  plannedDurationSeconds: 300,
  actualDurationSeconds: 300,
  startedAt: new Date(2026, 9, day, 11).toISOString(),
  endedAt: new Date(2026, 9, day, 12).toISOString(),
  status,
});
describe("local generator", () => {
  it.each([
    ["ЭКЗАМЕН ПО ФИЗИКЕ", "Учёба"],
    ["Убраться в комнате", "Уборка"],
    ["Начать заниматься спортом", "Спорт"],
    ["Написать курсовую", "Учёба"],
    ["Подготовить отчёт клиенту", "Работа"],
    ["Разобрать накопившиеся дела", "Организация"],
    ["Нарисовать картину", "Творчество"],
    ["Позвонить маме", "Личное"],
  ])("%s selects %s", (title, category) =>
    expect(categoryFor(title)).toBe(category),
  );
  it("creates unique meaningful editable steps", () => {
    const steps = generateSteps("Курсовая");
    expect(steps).toHaveLength(5);
    expect(steps[0].title).toContain("документ");
    expect(new Set(steps.map((s) => s.id)).size).toBe(5);
  });
  it("rejects whitespace and excessive titles", () => {
    expect(() => createTask("   ")).toThrow();
    expect(() => createTask("a".repeat(201))).toThrow();
    expect(createTask("  Привет  ").title).toBe("Привет");
  });
  it("reopens completed tasks and handles empty plans", () => {
    const t = createTask("Задача");
    const done = normalizeTask({
      ...t,
      steps: t.steps.map((s) => ({
        ...s,
        completed: true,
        completedAt: new Date(now).toISOString(),
      })),
    });
    expect(progress(done)).toBe(100);
    expect(done.status).toBe("completed");
    expect(
      normalizeTask({
        ...done,
        steps: done.steps.map((s, i) =>
          i ? s : { ...s, completed: false, completedAt: null },
        ),
      }).completedAt,
    ).toBeNull();
    expect(progress({ ...t, steps: [] })).toBe(0);
  });
});
describe("timer and persistence", () => {
  it("tracks timestamps, pause, resume, and reload without counting paused time", () => {
    let d = fresh();
    d = begin(d, d.tasks[0], 2, now);
    expect(remaining(d, now + 30000)).toBe(90);
    d = pause(d, now + 30000);
    expect(remaining(d, now + 999999)).toBe(90);
    d = parseData(JSON.stringify(d));
    d = resume(d, now + 300000);
    expect(remaining(d, now + 310000)).toBe(80);
    d = finish(d, d.activeTimer!.sessionId, false, now + 390000);
    expect(d.sessions[0].actualDurationSeconds).toBe(120);
    expect(d.sessions[0].status).toBe("completed");
    expect(d.activeTimer).toBeNull();
  });
  it("does not start a second session or count completion twice", () => {
    let d = fresh();
    d = begin(d, d.tasks[0], 5, now);
    expect(begin(d, d.tasks[0], 5, now)).toBe(d);
    const id = d.activeTimer!.sessionId;
    d = finish(d, id, false, now + 300000);
    expect(finish(d, id, false, now + 400000)).toBe(d);
    expect(d.sessions).toHaveLength(1);
  });
  it("restores overdue sessions at the actual end date", () => {
    let d = fresh();
    d = begin(d, d.tasks[0], 2, now);
    d = parseData(JSON.stringify(d));
    d = finish(d, d.activeTimer!.sessionId, false, now + 86400000);
    expect(d.sessions[0].endedAt).toBe(new Date(now + 120000).toISOString());
  });
  it("counts early minutes without a streak", () => {
    let d = fresh();
    d = begin(d, d.tasks[0], 5, now);
    d = finish(d, d.activeTimer!.sessionId, true, now + 65000);
    const stats = statistics(d, new Date(now));
    expect(stats.minutes).toBe(1);
    expect(stats.completed).toBe(0);
    expect(stats.current).toBe(0);
  });
  it("clamps remaining time after backward clock jumps", () => {
    let d = fresh();
    d = begin(d, d.tasks[0], 5, now);
    expect(remaining(d, now - 3600000)).toBe(300);
  });
});
describe("calendar statistics", () => {
  it("allows today to be empty but not yesterday", () => {
    expect(
      streaks(
        [session(25), session(26), session(27)],
        new Date(2026, 9, 28, 12),
      ),
    ).toEqual({ current: 3, best: 3 });
    expect(
      streaks([session(25), session(26)], new Date(2026, 9, 28, 12)),
    ).toEqual({ current: 0, best: 2 });
  });
  it("deduplicates days and ignores abandoned sessions", () => {
    expect(
      streaks(
        [session(27), session(27), session(28, "abandoned")],
        new Date(2026, 9, 28, 12),
      ),
    ).toEqual({ current: 1, best: 1 });
  });
  it("preserves historical focus after task deletion", () => {
    const d = fresh();
    d.tasks = [];
    d.sessions = [session(28)];
    expect(statistics(d, new Date(2026, 9, 28)).minutes).toBe(5);
  });
});
describe("import validation", () => {
  it("accepts an exported state", () =>
    expect(parseData(JSON.stringify(fresh())).version).toBe(1));
  it("rejects malformed data, versions and duplicate IDs", () => {
    expect(() => parseData("{")).toThrow();
    expect(() =>
      parseData(JSON.stringify({ ...fresh(), version: 2 })),
    ).toThrow();
    const d = fresh();
    d.tasks.push(d.tasks[0]);
    expect(() => parseData(JSON.stringify(d))).toThrow();
  });
  it("rejects orphan active timers and inconsistent task state", () => {
    const d = fresh();
    expect(() =>
      parseData(
        JSON.stringify({
          ...d,
          activeTimer: {
            sessionId: "missing",
            endsAt: new Date(now).toISOString(),
            remainingSecondsWhenPaused: null,
          },
        }),
      ),
    ).toThrow();
    d.tasks[0].status = "completed";
    expect(() => parseData(JSON.stringify(d))).toThrow();
  });
});

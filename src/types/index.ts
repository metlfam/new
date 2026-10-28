export type Category =
  | "Учёба"
  | "Уборка"
  | "Работа"
  | "Спорт"
  | "Творчество"
  | "Организация"
  | "Личное";
export interface Step {
  id: string;
  title: string;
  completed: boolean;
  completedAt: string | null;
}
export interface Task {
  id: string;
  title: string;
  category: Category;
  steps: Step[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  status: "active" | "completed";
}
export interface FocusSession {
  id: string;
  taskId: string;
  stepId: string;
  taskTitle: string;
  stepTitle: string;
  plannedDurationSeconds: number;
  actualDurationSeconds: number;
  startedAt: string;
  endedAt: string | null;
  status: "active" | "paused" | "completed" | "abandoned";
  outcome?: "done" | "partial" | "not-yet";
}
export interface ActiveTimer {
  sessionId: string;
  remainingSecondsWhenPaused: number | null;
  endsAt: string | null;
}
export interface Settings {
  theme: "light" | "dark" | "system";
  soundEnabled: boolean;
  defaultDurationMinutes: 2 | 5 | 10 | 15 | 25;
}
export interface AppData {
  version: 1;
  tasks: Task[];
  sessions: FocusSession[];
  activeTimer: ActiveTimer | null;
  settings: Settings;
}
export const durations = [2, 5, 10, 15, 25] as const;

import type { AppData } from "../types";
import { parseData } from "./validation";
export const STORAGE_KEY = "start-app-data-v1";
export const emptyData = (): AppData => ({
  version: 1,
  tasks: [],
  sessions: [],
  activeTimer: null,
  settings: { theme: "system", soundEnabled: false, defaultDurationMinutes: 5 },
});
let warning = "";
let rawBroken: string | null = null;
let memoryOnly = false;
function read(): AppData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    return parseData(raw);
  } catch (e) {
    warning =
      e instanceof SyntaxError || (e instanceof Error && e.name === "ZodError")
        ? "Сохранённые данные повреждены. Можно скачать исходный файл или сбросить данные в настройках. Новые изменения пока хранятся только в памяти."
        : "Хранилище недоступно или заполнено. Изменения сохраняются только в памяти. Скачай резервную копию в настройках.";
    try {
      rawBroken = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* storage denied */
    }
    memoryOnly = true;
    return null;
  }
}
let state = read() ?? emptyData();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());
export const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
export const getSnapshot = () => state;
export const getWarning = () => warning;
export const getBroken = () => rawBroken;
export const notify = (message: string) => {
  warning = message;
  emit();
};
let queue = Promise.resolve();
export function update(change: (data: AppData) => AppData): Promise<void> {
  const run = () => {
    if (!memoryOnly) state = read() ?? state;
    const next = change(state);
    if (next !== state) {
      state = next;
      if (!memoryOnly) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {
          memoryOnly = true;
          warning =
            "Хранилище недоступно или заполнено. Изменения сохраняются только в памяти. Скачай резервную копию в настройках.";
        }
      }
    }
    emit();
  };
  queue = queue
    .then(() =>
      navigator.locks
        ? navigator.locks.request("start-data-write", run)
        : run(),
    )
    .catch(() => notify("Не удалось сохранить изменение. Попробуй ещё раз."));
  return queue;
}
export async function replace(data: AppData) {
  let replaced = false;
  await update((current) => {
    if (current.activeTimer) {
      warning = "Сначала заверши текущую сессию, в том числе в другой вкладке.";
      return current;
    }
    replaced = true;
    memoryOnly = false;
    rawBroken = null;
    warning = "";
    return data;
  });
  return replaced;
}
window.addEventListener("storage", (e) => {
  if (e.key === STORAGE_KEY || e.key === null) {
    if (!memoryOnly) {
      state = read() ?? state;
      emit();
    }
  }
});
export function download(data: string, filename = "start-backup.json") {
  const url = URL.createObjectURL(
    new Blob([data], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

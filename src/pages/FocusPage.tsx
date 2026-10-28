import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  CircleCheck,
  Coffee,
  Pause,
  Play,
  Timer,
} from "lucide-react";
import { useAppData } from "../hooks/useAppData";
import { begin, finish, pause, resume } from "../lib/timer";
import { update } from "../lib/storage";
import { normalizeTask } from "../lib/taskGenerator";
import { Empty, Modal, PageHeading } from "../components/ui";
import { durations } from "../types";
import type { FocusSession, Settings } from "../types";
import { prepareSound } from "../lib/sound";
export function FocusPage({
  taskId,
  resultId,
  left,
  session,
}: {
  taskId?: string;
  resultId?: string;
  left: number;
  session?: FocusSession;
}) {
  const data = useAppData();
  const [minutes, setMinutes] = useState<Settings["defaultDurationMinutes"]>(
    taskId ? 5 : data.settings.defaultDurationMinutes,
  );
  const [selected, setSelected] = useState(taskId ?? "");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const tasks = data.tasks.filter(
    (t) => t.status === "active" && t.steps.some((s) => !s.completed),
  );
  const task = tasks.find((t) => t.id === selected) ?? tasks[0];
  const result = data.sessions.find((s) => s.id === resultId && s.endedAt);
  const toggle = () => {
    const clickedAt = Date.now();
    void update((d) =>
      d.activeTimer?.remainingSecondsWhenPaused !== null
        ? resume(d, clickedAt)
        : pause(d, clickedAt),
    );
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        e.code === "Space" &&
        session &&
        !["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(
          target.tagName,
        ) &&
        !target.isContentEditable &&
        !document.querySelector("dialog[open]")
      ) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [session]);
  const start = async () => {
    if (!task || busy) return;
    setBusy(true);
    if (data.settings.soundEnabled) prepareSound();
    await update((d) => {
      const current = d.tasks.find((t) => t.id === task.id);
      return current ? begin(d, current, minutes) : d;
    });
    location.hash = "/focus";
    setBusy(false);
  };
  if (!session && result) {
    const original = data.tasks.find((t) => t.id === result.taskId);
    const outcome = result.outcome;
    return (
      <div className="result-page card">
        <div className="result-icon">
          <CircleCheck size={38} />
        </div>
        <span className="eyebrow">МАЛЕНЬКИЙ ШАГ ВПЕРЁД</span>
        <h1>Ты сделал главное — начал!</h1>
        <p>Даже несколько минут движения вперёд имеют значение.</p>
        <div className="result-time">
          <Timer size={19} />
          {Math.floor(result.actualDurationSeconds / 60)} мин{" "}
          {Math.floor(result.actualDurationSeconds % 60)} сек в фокусе
          {result.status === "abandoned" && <span> · завершено раньше</span>}
        </div>
        <div className="result-task">
          <span>{result.taskTitle}</span>
          <strong>{result.stepTitle}</strong>
        </div>
        {!outcome ? (
          <>
            <h2>Удалось выполнить этот шаг?</h2>
            <div className="button-row centered">
              {[
                ["done", "Да, готово"],
                ["partial", "Частично"],
                ["not-yet", "Пока нет"],
              ].map(([v, label]) => (
                <button
                  key={v}
                  className={`button ${v === "done" ? "primary" : "secondary"}`}
                  onClick={() =>
                    void update((d) => ({
                      ...d,
                      sessions: d.sessions.map((s) =>
                        s.id === result.id
                          ? { ...s, outcome: v as FocusSession["outcome"] }
                          : s,
                      ),
                      tasks:
                        v === "done"
                          ? d.tasks.map((t) =>
                              t.id === result.taskId
                                ? normalizeTask({
                                    ...t,
                                    steps: t.steps.map((s) =>
                                      s.id === result.stepId
                                        ? {
                                            ...s,
                                            completed: true,
                                            completedAt:
                                              new Date().toISOString(),
                                          }
                                        : s,
                                    ),
                                  })
                                : t,
                            )
                          : d.tasks,
                    }))
                  }
                >
                  {v === "done" && <Check size={17} />} {label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2>
              {outcome === "done"
                ? "Один шаг уже позади."
                : outcome === "partial"
                  ? "Ты продвинулся. Это важно."
                  : "Ничего страшного. Ты уже выделил время на задачу."}
            </h2>
            <p>
              {original?.status === "completed"
                ? "Все шаги выполнены. Задача завершена!"
                : outcome === "not-yet"
                  ? "Попробуй сделать шаг ещё меньше или дай себе отдохнуть."
                  : "Можно сделать ещё один шаг или спокойно отдохнуть."}
            </p>
            <div className="button-row centered">
              {original?.status === "active" && (
                <button
                  className="button primary"
                  onClick={() => {
                    setMinutes(5);
                    setSelected(original.id);
                    location.hash = `/focus/${original.id}`;
                  }}
                >
                  Ещё 5 минут
                  <ArrowRight size={17} />
                </button>
              )}
              <a className="button secondary" href="#/tasks">
                Вернуться к задачам
              </a>
            </div>
          </>
        )}
      </div>
    );
  }
  if (!session && !task)
    return (
      <>
        <PageHeading
          eyebrow="ОДНО ДЕЛО ЗА РАЗ"
          title="Твой момент фокуса"
          text="Не нужно много времени. Нужно немного внимания."
        />
        <Empty
          title="С чего начнём?"
          text="Создай задачу и выбери один маленький шаг для фокус-сессии."
          onAction={() => {
            location.hash = "/";
          }}
        />
      </>
    );
  const paused = session?.status === "paused";
  const total = session?.plannedDurationSeconds ?? minutes * 60;
  const time = session ? left : total;
  const display = `${String(Math.floor(Math.ceil(time) / 60)).padStart(2, "0")}:${String(Math.ceil(time) % 60).padStart(2, "0")}`;
  return (
    <div className="focus-page">
      <span className="eyebrow">
        {session
          ? "ТЫ УЖЕ НАЧАЛ. ЭТО ГЛАВНОЕ."
          : "МЕСТО ДЛЯ ОДНОГО МАЛЕНЬКОГО ШАГА"}
      </span>
      <h1>
        {paused
          ? "Можно перевести дух"
          : session
            ? "Сейчас важно только одно"
            : "Давай просто начнём"}
      </h1>
      <p className="focus-subtitle">
        {paused
          ? "Время остановлено. Возвращайся, когда будешь готов."
          : "Остальное подождёт. Побудь здесь, с одной задачей."}
      </p>
      {!session && (
        <label className="focus-select">
          <span className="sr-only">Задача для фокуса</span>
          <select
            value={task?.id}
            onChange={(e) => setSelected(e.target.value)}
          >
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className={`timer-face ${paused ? "is-paused" : ""}`}>
        <svg viewBox="0 0 300 300" aria-hidden="true">
          <circle className="timer-track" cx="150" cy="150" r="136" />
          <circle
            className="timer-fill"
            cx="150"
            cy="150"
            r="136"
            strokeDasharray={2 * Math.PI * 136}
            strokeDashoffset={2 * Math.PI * 136 * (1 - time / total)}
          />
        </svg>
        <div className="timer-digits">
          <span>{display}</span>
          <small>
            {paused
              ? "НА ПАУЗЕ"
              : session
                ? "ВРЕМЯ ДЛЯ СЕБЯ"
                : "МИНУТ ДО ПЕРВОГО ШАГА"}
          </small>
        </div>
      </div>
      {!session && (
        <div className="duration-picker" aria-label="Длительность сессии">
          {durations.map((n) => (
            <button
              key={n}
              aria-pressed={minutes === n}
              onClick={() => setMinutes(n)}
            >
              {n} <span>мин</span>
            </button>
          ))}
        </div>
      )}
      <div className="current-step">
        <span>{session?.taskTitle ?? task?.title}</span>
        <h2>
          {session?.stepTitle ?? task?.steps.find((s) => !s.completed)?.title}
        </h2>
      </div>
      <div className="focus-controls">
        {session ? (
          <>
            <button className="button primary" onClick={toggle}>
              {paused ? <Play size={18} /> : <Pause size={18} />}{" "}
              {paused ? "Продолжить" : "Пауза"}
            </button>
            <button
              className="button secondary"
              onClick={() => setConfirm(true)}
            >
              Завершить раньше
            </button>
          </>
        ) : (
          <button
            className="button primary start-button"
            disabled={busy}
            onClick={start}
          >
            <Play size={18} />
            Начать фокус-сессию
          </button>
        )}
      </div>
      <div className="focus-hint">
        {session ? (
          <>
            <span className="keycap">Space</span> пауза / продолжение
          </>
        ) : (
          <>
            <Coffee size={16} />
            После сессии ты решишь, продолжать ли.
          </>
        )}
      </div>
      {confirm && (
        <Modal title="Завершить сессию?" onClose={() => setConfirm(false)}>
          <p>
            Уже потраченное время сохранится. Досрочная сессия не увеличивает
            серию активных дней.
          </p>
          <div className="button-row">
            <button
              className="button secondary"
              autoFocus
              onClick={() => setConfirm(false)}
            >
              Продолжить работу
            </button>
            <button
              className="button primary"
              onClick={async () => {
                const id = session!.id;
                await update((d) => finish(d, id, true));
                setConfirm(false);
                location.hash = `/focus/result/${id}`;
              }}
            >
              Завершить сессию
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

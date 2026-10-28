import { useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  CheckCircle2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useAppData } from "../hooks/useAppData";
import { update } from "../lib/storage";
import { id, normalizeTask, progress } from "../lib/taskGenerator";
import { Confirm, EditModal, Empty } from "../components/ui";
import type { Task } from "../types";
export function TaskDetailPage({ taskId }: { taskId: string }) {
  const data = useAppData();
  const task = data.tasks.find((t) => t.id === taskId);
  const [edit, setEdit] = useState<{ id: string; value: string } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [newStep, setNewStep] = useState("");
  if (!task)
    return (
      <Empty
        title="Задача не найдена"
        text="Возможно, она была удалена в другой вкладке."
        action="К моим задачам"
        onAction={() => {
          location.hash = "/tasks";
        }}
      />
    );
  const mutate = (fn: (t: Task) => Task) =>
    void update((d) => ({
      ...d,
      tasks: d.tasks.map((t) => (t.id === taskId ? normalizeTask(fn(t)) : t)),
    }));
  const first = task.steps.find((s) => !s.completed);
  const locked =
    data.sessions.find((s) => s.id === data.activeTimer?.sessionId)?.taskId ===
    taskId;
  return (
    <>
      <a className="back-link" href="#/tasks">
        <ArrowLeft size={17} />
        Мои задачи
      </a>
      <div className="detail-heading">
        <span className="eyebrow">БОЛЬШОЕ ДЕЛО НАЧИНАЕТСЯ С МАЛОГО</span>
        <div className="heading-row">
          <h1>{task.title}</h1>
          <div className="button-row">
            <button
              className="icon-button"
              aria-label="Изменить название"
              onClick={() => setEdit({ id: "title", value: task.title })}
            >
              <Pencil size={19} />
            </button>
            <button
              className="icon-button"
              aria-label="Удалить задачу"
              disabled={locked}
              title={locked ? "Сначала заверши фокус-сессию" : "Удалить задачу"}
              onClick={() => setDeleting("task")}
            >
              <Trash2 size={19} />
            </button>
          </div>
        </div>
        <div className="detail-meta">
          <span className="tag">{task.category}</span>
          <span>
            {task.steps.filter((s) => s.completed).length} из{" "}
            {task.steps.length} шагов выполнено
          </span>
          <strong>{progress(task)}%</strong>
        </div>
        <div className="progress-track">
          <div style={{ width: `${progress(task)}%` }} />
        </div>
      </div>
      <div className="plan-layout">
        <section className="card plan-card">
          <div className="section-heading">
            <h2>Твой план</h2>
            <span className="muted small">Можно менять под себя</span>
          </div>
          <ol className="steps">
            {task.steps.map((step, index) => (
              <li
                key={step.id}
                className={`${step.completed ? "completed" : ""} ${first?.id === step.id ? "next-step" : ""}`}
              >
                <button
                  className="step-check"
                  role="checkbox"
                  aria-checked={step.completed}
                  aria-label={`Выполнено: ${step.title}`}
                  onClick={() =>
                    mutate((t) => ({
                      ...t,
                      steps: t.steps.map((s) =>
                        s.id === step.id
                          ? {
                              ...s,
                              completed: !s.completed,
                              completedAt: s.completed
                                ? null
                                : new Date().toISOString(),
                            }
                          : s,
                      ),
                    }))
                  }
                >
                  {step.completed ? <Check size={18} /> : index + 1}
                </button>
                <div className="step-copy">
                  {first?.id === step.id && (
                    <span className="step-caption">НАЧНИ ЗДЕСЬ</span>
                  )}
                  <span>{step.title}</span>
                </div>
                <div className="step-actions">
                  <button
                    className="icon-button"
                    aria-label={`Изменить шаг ${index + 1}`}
                    onClick={() => setEdit({ id: step.id, value: step.title })}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Шаг ${index + 1} вверх`}
                    disabled={index === 0}
                    onClick={() =>
                      mutate((t) => {
                        const steps = [...t.steps];
                        [steps[index - 1], steps[index]] = [
                          steps[index],
                          steps[index - 1],
                        ];
                        return { ...t, steps };
                      })
                    }
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Шаг ${index + 1} вниз`}
                    disabled={index === task.steps.length - 1}
                    onClick={() =>
                      mutate((t) => {
                        const steps = [...t.steps];
                        [steps[index + 1], steps[index]] = [
                          steps[index],
                          steps[index + 1],
                        ];
                        return { ...t, steps };
                      })
                    }
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Удалить шаг ${index + 1}`}
                    disabled={locked}
                    onClick={() => setDeleting(step.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ol>
          <form
            className="add-step"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newStep.trim() || task.steps.length >= 200) return;
              mutate((t) => ({
                ...t,
                steps: [
                  ...t.steps,
                  {
                    id: id(),
                    title: newStep.trim(),
                    completed: false,
                    completedAt: null,
                  },
                ],
              }));
              setNewStep("");
            }}
          >
            <input
              aria-label="Новый шаг"
              placeholder="Добавить свой маленький шаг…"
              value={newStep}
              onChange={(e) => setNewStep(e.target.value)}
              maxLength={200}
            />
            <button
              className="icon-button"
              aria-label="Добавить шаг"
              disabled={!newStep.trim() || task.steps.length >= 200}
            >
              <Plus size={21} />
            </button>
          </form>
          <p className="local-note">
            <Sparkles size={15} />
            План составлен по локальным шаблонам. Ты знаешь свою задачу лучше —
            смело меняй шаги.
          </p>
        </section>
        <aside className="card first-step-card">
          <span className="stat-icon lavender">
            {first ? <Sparkles size={23} /> : <CheckCircle2 size={23} />}
          </span>
          <h2>{first ? "Всего пять минут" : "Это получилось!"}</h2>
          <p>
            {first
              ? "Не думай обо всём плане. Сейчас достаточно одного маленького действия."
              : task.steps.length
                ? "Все шаги выполнены. Дай себе немного времени насладиться результатом."
                : "Добавь первый маленький шаг, чтобы начать."}
          </p>
          {first && (
            <a className="button primary" href={`#/focus/${taskId}`}>
              {data.activeTimer ? "К текущей сессии" : "Начать с 5 минут"}
              <ArrowRight size={17} />
            </a>
          )}
          <a className="text-link" href="#/tasks">
            Вернуться к задачам
          </a>
          <span className="small muted">
            {locked
              ? "Во время фокуса удаление недоступно."
              : "В твоём темпе. Без давления."}
          </span>
        </aside>
      </div>
      {edit && (
        <EditModal
          title={edit.id === "title" ? "Название задачи" : "Изменить шаг"}
          value={edit.value}
          onClose={() => setEdit(null)}
          onSave={(value) =>
            mutate((t) =>
              edit.id === "title"
                ? { ...t, title: value }
                : {
                    ...t,
                    steps: t.steps.map((s) =>
                      s.id === edit.id ? { ...s, title: value } : s,
                    ),
                  },
            )
          }
        />
      )}
      {deleting && (
        <Confirm
          title={deleting === "task" ? "Удалить задачу?" : "Удалить шаг?"}
          description={
            deleting === "task"
              ? "План будет удалён. История фокус-сессий останется в статистике."
              : "Этот шаг исчезнет из плана. Остальные шаги сохранятся."
          }
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            if (deleting === "task") {
              void update((d) =>
                d.activeTimer &&
                d.sessions.find((s) => s.id === d.activeTimer?.sessionId)
                  ?.taskId === taskId
                  ? d
                  : { ...d, tasks: d.tasks.filter((t) => t.id !== taskId) },
              );
              location.hash = "/tasks";
            } else {
              void update((d) => {
                const active = d.sessions.find(
                  (s) => s.id === d.activeTimer?.sessionId,
                );
                if (active?.taskId === taskId) return d;
                return {
                  ...d,
                  tasks: d.tasks.map((t) =>
                    t.id === taskId
                      ? normalizeTask({
                          ...t,
                          steps: t.steps.filter((s) => s.id !== deleting),
                        })
                      : t,
                  ),
                };
              });
            }
          }}
        />
      )}
    </>
  );
}

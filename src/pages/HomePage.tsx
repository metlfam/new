import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  Flame,
  Leaf,
  Sparkles,
} from "lucide-react";
import { useAppData } from "../hooks/useAppData";
import { createTask } from "../lib/taskGenerator";
import { update } from "../lib/storage";
import { statistics } from "../lib/statistics";
const examples = [
  "Подготовиться к экзамену",
  "Убраться в комнате",
  "Начать заниматься спортом",
  "Написать курсовую",
  "Разобрать накопившиеся дела",
];
export function HomePage() {
  const data = useAppData();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const stat = statistics(data);
  const recent = [...data.tasks]
    .filter((t) => t.status === "active")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="tiny-dot" />
            МАЛЕНЬКИЕ ШАГИ. БОЛЬШИЕ ПЕРЕМЕНЫ.
          </div>
          <h1>
            <span className="hero-title-first">Самое сложное —</span>
            <br />
            <span>начать.</span>
          </h1>
          <p>
            Напиши, что откладываешь. Мы превратим это
            <br className="desktop-break" /> в маленький первый шаг.
          </p>
          <div className="hero-note">
            <Leaf size={16} />
            Без спешки. Без давления. В твоём темпе.
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-spark">✦</div>
          <div className="step-block block-one" />
          <div className="step-block block-two" />
          <div className="step-block block-three" />
          <div className="art-orb">
            <ArrowUpRight size={58} strokeWidth={1.4} />
          </div>
          <div className="art-pill">
            <Check size={14} />
            Один шаг — уже начало
          </div>
        </div>
      </section>
      <section className="composer card">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!title.trim() || busy) return;
            setBusy(true);
            const task = createTask(title);
            await update((d) => ({ ...d, tasks: [task, ...d.tasks] }));
            location.hash = `/task/${task.id}`;
            setBusy(false);
          }}
        >
          <label htmlFor="new-task">
            Что ты откладываешь? <Sparkles size={19} />
          </label>
          <textarea
            id="new-task"
            placeholder="Например: подготовиться к экзамену по математике"
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={2}
          />
          <div className="composer-footer">
            <span>
              <span className="small-dot" />
              Большую задачу можно сделать маленькой
            </span>
            <button className="button primary" disabled={!title.trim() || busy}>
              {busy ? "Создаём план…" : "Разбить на шаги"}
              <ArrowRight size={18} />
            </button>
          </div>
        </form>
        <div className="examples">
          <span>Или попробуй:</span>
          {examples.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTitle(t);
                document.getElementById("new-task")?.focus();
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </section>
      <section className="today-section">
        <div className="section-heading">
          <h2>Твоё маленькое сегодня</h2>
          <a href="#/progress">
            Весь прогресс
            <ArrowUpRight size={15} />
          </a>
        </div>
        <div className="stats-row">
          {[
            [Clock3, stat.todayMinutes, "минут в фокусе", "lavender"],
            [Check, stat.todaySessions, "завершённых сессий", "mint"],
            [Flame, stat.current, "дней подряд", "peach"],
          ].map(([Icon, value, label, color]) => {
            const I = Icon as typeof Clock3;
            return (
              <div className="stat-card card" key={String(label)}>
                <span className={`stat-icon ${color}`}>
                  <I size={22} />
                </span>
                <div>
                  <strong>{String(value)}</strong>
                  <span>{String(label)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      {recent && (
        <section className="continue-card card">
          <div>
            <span className="eyebrow">ПРОДОЛЖИМ НАЧАТОЕ?</span>
            <h3>{recent.title}</h3>
            <p>
              {recent.steps.find((s) => !s.completed)?.title ??
                "Добавь первый шаг"}
            </p>
          </div>
          <a className="button secondary" href={`#/task/${recent.id}`}>
            Продолжить
            <ArrowRight size={17} />
          </a>
        </section>
      )}
      <div className="gentle-note">
        <span className="note-art">✳︎</span>
        <div>
          <strong>Не нужно делать всё. Нужно просто начать.</strong>
          <p>Даже пять минут — это движение вперёд. И этого достаточно.</p>
        </div>
      </div>
      <footer className="home-footer">
        <span>Меньше откладывать. Больше жить.</span>
        <span>
          Сделано для твоего спокойствия <Leaf size={13} />
        </span>
      </footer>
    </div>
  );
}

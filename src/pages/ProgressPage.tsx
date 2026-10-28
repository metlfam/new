import {
  CheckCheck,
  Clock3,
  Flame,
  ListChecks,
  Sprout,
  Timer,
} from "lucide-react";
import { PageHeading } from "../components/ui";
import { useAppData } from "../hooks/useAppData";
import { statistics } from "../lib/statistics";
export function ProgressPage() {
  const data = useAppData(),
    s = statistics(data);
  const maximum = Math.max(10, ...s.week.map((d) => d.minutes));
  const items = [
    [Clock3, s.minutes, "минут в фокусе"],
    [Timer, s.completed, "полных сессий"],
    [CheckCheck, s.steps, "выполненных шагов"],
    [ListChecks, s.tasks, "завершённых задач"],
    [Flame, s.current, "дней подряд"],
    [Sprout, s.best, "лучшая серия дней"],
  ] as const;
  return (
    <>
      <PageHeading
        eyebrow="КАЖДЫЙ ШАГ ИМЕЕТ ЗНАЧЕНИЕ"
        title="Твой прогресс"
        text={
          s.completed === 0
            ? "Первый шаг ещё впереди. Начни с двух минут."
            : s.completed < 5
              ? "Отличное начало! Ты уже движешься вперёд."
              : s.completed < 20
                ? "У тебя уже формируется полезная привычка."
                : "Посмотри, сколько ты уже сделал."
        }
      />
      <div className="progress-stats">
        {items.map(([Icon, value, label]) => (
          <div className="card metric" key={label}>
            <span className="stat-icon lavender">
              <Icon size={21} />
            </span>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <section className="card chart-card">
        <div className="section-heading">
          <div>
            <h2>Немного каждый день</h2>
            <p>Минуты в фокусе за последние 7 дней</p>
          </div>
          <span className="tag">Твоя неделя</span>
        </div>
        <div
          className="week-chart"
          role="img"
          aria-label={s.week
            .map(
              (d) =>
                `${d.date.toLocaleDateString("ru-RU")}: ${d.minutes} минут`,
            )
            .join("; ")}
        >
          {s.week.map((d, i) => (
            <div className={`chart-day ${i === 6 ? "today" : ""}`} key={i}>
              <span>{d.minutes}</span>
              <div className="bar-area">
                <div
                  className="bar"
                  style={{
                    height: d.minutes
                      ? `${Math.max(2, (d.minutes / maximum) * 100)}%`
                      : "3px",
                  }}
                />
              </div>
              <strong>
                {d.date.toLocaleDateString("ru-RU", { weekday: "short" })}
              </strong>
              <small>{d.date.getDate()}</small>
            </div>
          ))}
        </div>
        <p className="chart-note">
          Серия растёт после полной сессии. Даже если закончить раньше, минуты
          фокуса сохранятся.
        </p>
      </section>
      <section className="card history-card">
        <div className="section-heading">
          <h2>Последние маленькие победы</h2>
          <span className="muted small">История сессий</span>
        </div>
        {data.sessions.some((s) => s.endedAt) ? (
          [...data.sessions]
            .filter((s) => s.endedAt)
            .reverse()
            .slice(0, 8)
            .map((session) => (
              <div className="history-row" key={session.id}>
                <span className="stat-icon mint">
                  <CheckCheck size={19} />
                </span>
                <div>
                  <strong>{session.taskTitle}</strong>
                  <span>
                    {new Date(session.endedAt!).toLocaleString("ru-RU", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    ·{" "}
                    {session.status === "completed"
                      ? "Полная сессия"
                      : "Завершена раньше"}
                  </span>
                </div>
                <span className="tag">
                  {Math.floor(session.actualDurationSeconds / 60)} мин{" "}
                  {Math.floor(session.actualDurationSeconds % 60)} с
                </span>
              </div>
            ))
        ) : (
          <p className="history-empty">
            Здесь появится твоя первая сессия. Большое начинается с малого.
          </p>
        )}
      </section>
    </>
  );
}

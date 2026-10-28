import { useEffect, useState, useSyncExternalStore } from "react";
import {
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  CircleHelp,
  Home,
  LayoutList,
  Leaf,
  Settings,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { useAppData } from "./hooks/useAppData";
import { useFocusTimer } from "./hooks/useFocusTimer";
import { getWarning, subscribe } from "./lib/storage";
import { HomePage } from "./pages/HomePage";
import { TasksPage } from "./pages/TasksPage";
import { TaskDetailPage } from "./pages/TaskDetailPage";
import { FocusPage } from "./pages/FocusPage";
import { ProgressPage } from "./pages/ProgressPage";
import { SettingsPage } from "./pages/SettingsPage";
import { Modal } from "./components/ui";
const links = [
  ["", "Главная", Home],
  ["tasks", "Мои задачи", LayoutList],
  ["focus", "Фокус", Timer],
  ["progress", "Прогресс", BarChart3],
  ["settings", "Настройки", Settings],
] as const;
export default function App() {
  const data = useAppData();
  const timer = useFocusTimer();
  const [path, setPath] = useState(location.hash.slice(1) || "/");
  const [help, setHelp] = useState(false);
  const warning = useSyncExternalStore(subscribe, getWarning);
  useEffect(() => {
    const fn = () => {
      setPath(location.hash.slice(1) || "/");
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme =
        data.settings.theme === "system"
          ? media.matches
            ? "dark"
            : "light"
          : data.settings.theme;
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [data.settings.theme]);
  const parts = path.split("/").filter(Boolean);
  const section = parts[0] ?? "";
  const active = section === "task" ? "tasks" : section;
  const label = links.find((l) => l[0] === active)?.[1] ?? "Главная";
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#/" aria-label="START — главная">
          <span className="brand-mark">
            <ArrowUpRight size={24} />
          </span>
          START<span className="brand-dot">.</span>
        </a>
        <div className="sidebar-caption">МЕНЬШЕ ПЛАНОВ. БОЛЬШЕ НАЧАЛ.</div>
        <nav aria-label="Основная навигация">
          {links.map(([route, title, Icon]) => (
            <a
              key={route}
              href={`#/${route}`}
              aria-label={title}
              className={active === route ? "active" : ""}
              aria-current={active === route ? "page" : undefined}
            >
              <Icon size={20} />
              <span>{title}</span>
              {route === "tasks" &&
                data.tasks.filter((t) => t.status === "active").length > 0 && (
                  <b>
                    {data.tasks.filter((t) => t.status === "active").length}
                  </b>
                )}
              {route === "focus" && data.activeTimer && (
                <i className="tiny-dot" />
              )}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-message">
            <span className="little-sun">✳︎</span>
            <strong>Начни с малого.</strong>
            <p>
              Не идеальный момент.
              <br />
              Просто этот.
            </p>
          </div>
          <button className="help-button" onClick={() => setHelp(true)}>
            <CircleHelp size={18} />
            Как это работает
            <ArrowUpRight size={15} />
          </button>
          <span className="local-status">
            <span className="small-dot" />
            Твоё пространство. Только для тебя.
          </span>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <span className="breadcrumb">
            Твоё пространство
            <ChevronRight size={14} />
            <strong>{label}</strong>
          </span>
          <span className="topbar-date">
            {new Date().toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
              weekday: "long",
            })}
          </span>
          <span className="mobile-brand">
            START<span>.</span>
          </span>
          <span className="private-label">
            <ShieldCheck size={15} />
            Всё остаётся у тебя
          </span>
        </header>
        <main id="main-content" className="main-content">
          {warning && (
            <div className="storage-warning" role="alert">
              {warning}
              <a href="#/settings">Открыть настройки</a>
            </div>
          )}
          {data.activeTimer && active !== "focus" && (
            <a className="running-banner" href="#/focus">
              <Timer size={17} />
              {timer.session?.status === "paused"
                ? "Сессия на паузе"
                : "Фокус-сессия продолжается"}
              <span>
                Вернуться
                <ArrowUpRight size={16} />
              </span>
            </a>
          )}
          {section === "tasks" ? (
            <TasksPage />
          ) : section === "task" ? (
            <TaskDetailPage key={parts[1]} taskId={parts[1]} />
          ) : section === "focus" ? (
            <FocusPage
              key={path}
              taskId={parts[1] !== "result" ? parts[1] : undefined}
              resultId={parts[1] === "result" ? parts[2] : undefined}
              {...timer}
            />
          ) : section === "progress" ? (
            <ProgressPage />
          ) : section === "settings" ? (
            <SettingsPage />
          ) : (
            <HomePage />
          )}
        </main>
      </div>
      {help && (
        <Modal
          title="Большое начинается с малого"
          onClose={() => setHelp(false)}
        >
          <ol className="help-steps">
            <li>
              Напиши, что откладываешь. START предложит несколько шагов по
              локальным шаблонам.
            </li>
            <li>Подстрой план под себя и начни с одного действия.</li>
            <li>
              Включи таймер. После сессии отметь результат и реши, хочется ли
              продолжить.
            </li>
          </ol>
          <p>
            <Leaf size={17} /> Здесь нет оценок и гонки. Даже маленький шаг
            имеет значение.
          </p>
          <button className="button primary" onClick={() => setHelp(false)}>
            Попробуем
            <ArrowUpRight size={18} />
          </button>
        </Modal>
      )}
    </div>
  );
}

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useAppData } from "../hooks/useAppData";
import { Empty, PageHeading } from "../components/ui";
import { TaskCard } from "../components/TaskCard";
export function TasksPage() {
  const { tasks } = useAppData();
  const [filter, setFilter] = useState("active");
  const [search, setSearch] = useState("");
  const selected = tasks.filter(
    (t) =>
      (filter === "all" || t.status === filter) &&
      t.title.toLocaleLowerCase().includes(search.toLocaleLowerCase().trim()),
  );
  return (
    <>
      <PageHeading
        eyebrow="ШАГ ЗА ШАГОМ"
        title="Мои задачи"
        text="Всё, что важно. По одному маленькому шагу."
      >
        <a className="button primary" href="#/">
          <Plus size={18} />
          Новая задача
        </a>
      </PageHeading>
      <div className="list-tools">
        <div className="segmented" aria-label="Фильтр задач">
          {[
            ["active", "Активные"],
            ["completed", "Завершённые"],
            ["all", "Все"],
          ].map(([v, label]) => (
            <button
              key={v}
              aria-pressed={filter === v}
              onClick={() => setFilter(v)}
            >
              {label}
              <span>
                {tasks.filter((t) => v === "all" || t.status === v).length}
              </span>
            </button>
          ))}
        </div>
        <label className="search">
          <Search size={18} />
          <input
            placeholder="Найти задачу"
            aria-label="Поиск задач"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      {selected.length ? (
        <div className="task-grid">
          {selected.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <Empty
          title={tasks.length ? "Ничего не найдено" : "Пока здесь пусто"}
          text={
            tasks.length
              ? "Попробуй изменить запрос или фильтр."
              : "Добавь первое дело. Мы поможем сделать первый шаг."
          }
          onAction={() => {
            location.hash = "/";
          }}
        />
      )}
    </>
  );
}

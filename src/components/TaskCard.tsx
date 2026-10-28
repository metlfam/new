import type { Task } from "../types";
import { ArrowUpRight, CheckCircle2, Circle } from "lucide-react";
import { progress } from "../lib/taskGenerator";
export function TaskCard({ task }: { task: Task }) {
  return (
    <a className="task-card card" href={`#/task/${task.id}`}>
      <div className="task-meta">
        <span className={`tag category-${task.category}`}>{task.category}</span>
        <span>
          {new Date(task.createdAt).toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "short",
          })}
        </span>
      </div>
      <h3>
        {task.title}
        <ArrowUpRight size={19} />
      </h3>
      <div className="task-status">
        {task.status === "completed" ? (
          <CheckCircle2 size={16} />
        ) : (
          <Circle size={15} />
        )}{" "}
        {task.status === "completed" ? "Завершена" : "В процессе"}
      </div>
      <div className="progress-track">
        <div style={{ width: `${progress(task)}%` }} />
      </div>
      <div className="task-bottom">
        <span>
          {task.steps.filter((s) => s.completed).length} из {task.steps.length}{" "}
          шагов
        </span>
        <strong>{progress(task)}%</strong>
      </div>
    </a>
  );
}

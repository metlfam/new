import type { Category, Step, Task } from "../types";
export function id() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
  );
}
const rules: [Category, RegExp, string[]][] = [
  [
    "Учёба",
    /экзамен|уч[её]б|выуч|изуч|урок|домашк|математ|физик|конспект|тест|зач[её]т|курсов|диплом|реферат/giu,
    [
      "Открыть материалы по теме",
      "Выбрать один небольшой раздел",
      "Прочитать основные определения",
      "Выписать три ключевые мысли",
      "Проверить себя на одном примере",
    ],
  ],
  [
    "Уборка",
    /убра|убор|комнат|квартир|порядок|вещ|посуд/giu,
    [
      "Выбрать одну небольшую поверхность",
      "Убрать с неё очевидный мусор",
      "Разложить пять вещей по местам",
      "Протереть освобождённую поверхность",
      "Посмотреть на результат и выбрать следующий участок",
    ],
  ],
  [
    "Спорт",
    /спорт|трениров|зал(?![а-яё])|зарядк|пробеж|упражнен|бегать/giu,
    [
      "Подготовить удобную одежду",
      "Освободить немного места для движения",
      "Сделать лёгкую разминку",
      "Выполнить одно комфортное упражнение",
      "Выпить воды и отметить самочувствие",
    ],
  ],
  [
    "Организация",
    /разобра|организ|спланир|документ|дела|список/giu,
    [
      "Открыть чистую заметку",
      "Записать три дела, которые приходят в голову",
      "Выбрать одно самое простое дело",
      "Подготовить всё для первого действия",
      "Уделить выбранному делу пять минут",
    ],
  ],
  [
    "Работа",
    /работ|проект|отч[её]т|презентац|документ|письм|задач|клиент/giu,
    [
      "Открыть нужный документ или рабочие материалы",
      "Записать ожидаемый результат одним предложением",
      "Набросать три основных пункта",
      "Подготовить черновик первого пункта",
      "Записать, что нужно сделать дальше",
    ],
  ],
  [
    "Творчество",
    /напис|нарис|созда|придум|дизайн|стать|книг/giu,
    [
      "Открыть чистый лист или рабочий файл",
      "Собрать два примера для вдохновения",
      "Записать три идеи без оценки",
      "Сделать первый небольшой набросок",
      "Выбрать одну деталь для продолжения",
    ],
  ],
];
export function categoryFor(title: string): Category {
  let score = 0;
  let category: Category = "Личное";
  for (const [c, pattern] of rules) {
    const count = [...title.toLowerCase().matchAll(pattern)].length;
    if (count > score) {
      score = count;
      category = c;
    }
  }
  return category;
}
export function generateSteps(title: string): Step[] {
  const category = categoryFor(title);
  let texts = rules.find((r) => r[0] === category)?.[2] ?? [
    "Записать желаемый результат одним предложением",
    "Подготовить всё необходимое",
    "Выбрать самое маленькое действие",
    "Выполнять его пять минут",
    "Отметить результат и следующий шаг",
  ];
  if (/курсов|диплом|реферат/iu.test(title))
    texts = [
      "Открыть документ для работы",
      "Прочитать требования к работе",
      "Набросать план из трёх разделов",
      "Найти один источник по теме",
      "Написать первые три предложения черновика",
    ];
  if (/экзамен/iu.test(title))
    texts = [
      "Открыть список экзаменационных тем",
      "Выбрать одну тему",
      "Прочитать основные определения",
      "Выписать три ключевые идеи или формулы",
      "Ответить на один вопрос по теме",
    ];
  return texts.map((title) => ({
    id: id(),
    title,
    completed: false,
    completedAt: null,
  }));
}
export function normalizeTask(
  task: Task,
  now = new Date().toISOString(),
): Task {
  const done = task.steps.length > 0 && task.steps.every((s) => s.completed);
  return {
    ...task,
    updatedAt: now,
    status: done ? "completed" : "active",
    completedAt: done ? (task.completedAt ?? now) : null,
  };
}
export function progress(task: Task) {
  return task.steps.length
    ? Math.round(
        (task.steps.filter((s) => s.completed).length / task.steps.length) *
          100,
      )
    : 0;
}
export function createTask(title: string): Task {
  const clean = title.trim();
  if (!clean || clean.length > 200)
    throw new Error("Название должно содержать от 1 до 200 символов");
  const now = new Date().toISOString();
  return {
    id: id(),
    title: clean,
    category: categoryFor(clean),
    steps: generateSteps(clean),
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    status: "active",
  };
}

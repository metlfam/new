import { readFile } from "node:fs/promises";
import { test, expect, type Page } from "@playwright/test";
const key = "start-app-data-v1";
async function create(
  page: Page,
  title = "Подготовиться к экзамену по физике",
) {
  await page.goto("/");
  await page.getByLabel("Что ты откладываешь?").fill(title);
  await page.getByRole("button", { name: "Разбить на шаги" }).click();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
}
async function start(page: Page) {
  await page.getByRole("link", { name: "Начать с 5 минут" }).click();
  await page.getByRole("button", { name: "2 мин", exact: true }).click();
  await page.getByRole("button", { name: "Начать фокус-сессию" }).click();
  await expect(
    page.getByRole("button", { name: "Пауза", exact: true }),
  ).toBeVisible();
}
test("create, edit, complete, reorder, persist, and search", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Разбить на шаги" }),
  ).toBeDisabled();
  await create(page);
  await expect(page.getByRole("checkbox")).toHaveCount(5);
  await page
    .getByRole("button", { name: "Изменить шаг 1", exact: true })
    .click();
  await page.getByLabel("Текст", { exact: true }).fill("Открыть учебник");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Выполнено: Открыть учебник" })
    .click();
  await expect(
    page.getByRole("checkbox", { name: "Выполнено: Открыть учебник" }),
  ).toBeChecked();
  await page.reload();
  await expect(
    page.getByRole("checkbox", { name: "Выполнено: Открыть учебник" }),
  ).toBeChecked();
  await expect(page.getByText("20%", { exact: true })).toBeVisible();
  await page
    .getByLabel("Новый шаг", { exact: true })
    .fill("Прочитать страницу");
  await page.getByRole("button", { name: "Добавить шаг", exact: true }).click();
  await expect(page.getByRole("checkbox")).toHaveCount(6);
  await page.getByRole("button", { name: "Шаг 6 вверх", exact: true }).click();
  await expect(page.getByRole("checkbox").nth(4)).toHaveAccessibleName(
    "Выполнено: Прочитать страницу",
  );
  await page.getByRole("link", { name: "Вернуться к задачам" }).click();
  await page
    .getByRole("textbox", { name: "Поиск задач" })
    .fill("несуществующая");
  await expect(
    page.getByRole("heading", { name: "Ничего не найдено" }),
  ).toBeVisible();
});
test("pause survives reload, timer completes, result updates progress", async ({
  page,
}) => {
  await page.clock.install();
  await create(page);
  await start(page);
  await page.clock.fastForward(10000);
  await expect(page.locator(".timer-digits>span")).toHaveText("01:50");
  await page.getByRole("button", { name: "Пауза", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Продолжить", exact: true }),
  ).toBeVisible();
  await page.clock.fastForward(30000);
  await expect(page.locator(".timer-digits>span")).toHaveText("01:50");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Продолжить", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Продолжить", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Пауза", exact: true }),
  ).toBeVisible();
  await page.clock.fastForward(110100);
  await expect(
    page.getByRole("heading", { name: "Ты сделал главное — начал!" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Да, готово" }).click();
  await page.getByRole("link", { name: "Прогресс", exact: true }).click();
  await expect(
    page
      .locator(".metric")
      .filter({ hasText: "полных сессий" })
      .locator("strong"),
  ).toHaveText("1");
  await expect(
    page
      .locator(".metric")
      .filter({ hasText: "минут в фокусе" })
      .locator("strong"),
  ).toHaveText("2");
  await page.reload();
  const data = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!),
    key,
  );
  expect(data.sessions).toHaveLength(1);
  expect(data.tasks[0].steps[0].completed).toBe(true);
});
test("early finish asks permission and does not add a streak", async ({
  page,
}) => {
  await page.clock.install();
  await create(page);
  await start(page);
  await page.clock.fastForward(61000);
  await page.getByRole("button", { name: "Завершить раньше" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Продолжить работу" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Завершить раньше" }).click();
  await page
    .getByRole("button", { name: "Завершить сессию", exact: true })
    .click();
  await page.getByRole("button", { name: "Частично" }).click();
  await page.getByRole("link", { name: "Прогресс", exact: true }).click();
  await expect(
    page
      .locator(".metric")
      .filter({ hasText: "дней подряд" })
      .locator("strong"),
  ).toHaveText("0");
  await expect(
    page
      .locator(".metric")
      .filter({ hasText: "минут в фокусе" })
      .locator("strong"),
  ).toHaveText("1");
});
test("themes, export, reset, import and invalid JSON", async ({ page }) => {
  await create(page, "Убраться в комнате");
  await page.getByRole("link", { name: "Настройки", exact: true }).click();
  await page.getByRole("button", { name: "Тёмная", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Скачать мои данные" }).click();
  const downloaded = await dl;
  expect(downloaded.suggestedFilename()).toMatch(/start-.*json/);
  const backup = await readFile((await downloaded.path())!, "utf8");
  expect(JSON.parse(backup).tasks[0].title).toBe("Убраться в комнате");
  await page.locator("input[type=file]").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from("{}"),
  });
  await expect(page.getByRole("status")).toContainText("Не удалось прочитать");
  await page
    .getByRole("button", { name: "Удалить все мои данные", exact: true })
    .click();
  await page.getByRole("button", { name: "Удалить", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.locator("input[type=file]").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(backup),
  });
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: "Заменить данные", exact: true })
    .click();
  await page.getByRole("link", { name: "Мои задачи", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Убраться в комнате" }),
  ).toBeVisible();
});
test("two tabs share one active timer and only one completion", async ({
  page,
  context,
}) => {
  await create(page);
  await start(page);
  const other = await context.newPage();
  await other.goto("/#/focus");
  await expect(
    other.getByRole("button", { name: "Пауза", exact: true }),
  ).toBeVisible();
  await other.getByRole("button", { name: "Пауза", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Продолжить", exact: true }),
  ).toBeVisible();
  await other.getByRole("button", { name: "Продолжить", exact: true }).click();
  await expect(
    other.getByRole("button", { name: "Пауза", exact: true }),
  ).toBeVisible();
  await page.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k)!);
    d.activeTimer.endsAt = new Date(Date.now() - 1000).toISOString();
    localStorage.setItem(k, JSON.stringify(d));
  }, key);
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(
        (k) => JSON.parse(localStorage.getItem(k)!).activeTimer,
        key,
      ),
    )
    .toBeNull();
  await other.reload();
  const data = await other.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!),
    key,
  );
  expect(data.sessions).toHaveLength(1);
  expect(data.sessions[0].status).toBe("completed");
});
test("expired timer recovers after reopening and deleted task retains history", async ({
  page,
}) => {
  await create(page);
  await start(page);
  await page.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k)!);
    d.activeTimer.endsAt = new Date(Date.now() - 1000).toISOString();
    localStorage.setItem(k, JSON.stringify(d));
  }, key);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Ты сделал главное — начал!" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Пока нет", exact: true }).click();
  await page
    .getByRole("link", { name: "Вернуться к задачам", exact: true })
    .click();
  await page.locator(".task-card").click();
  await page
    .getByRole("button", { name: "Удалить задачу", exact: true })
    .click();
  await page.getByRole("button", { name: "Удалить", exact: true }).click();
  await page.getByRole("link", { name: "Прогресс", exact: true }).click();
  await expect(
    page
      .locator(".metric")
      .filter({ hasText: "полных сессий" })
      .locator("strong"),
  ).toHaveText("1");
});
test("corrupted storage is preserved and recoverable", async ({ page }) => {
  await page.goto("/");
  await page.evaluate((k) => localStorage.setItem(k, "{broken"), key);
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("повреждены");
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe(
    "{broken",
  );
  await page.getByRole("link", { name: "Открыть настройки" }).click();
  await expect(
    page.getByRole("button", { name: "Скачать исходные повреждённые данные" }),
  ).toBeVisible();
});
test("all pages fit mobile screens and desktop without JS errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await create(page, "Очень длинная задача ".repeat(9));
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const hash of ["/", "/tasks", "/focus", "/progress", "/settings"]) {
      await page.goto("/#" + hash);
      await expect(page.locator("h1")).toBeVisible();
      const fits = await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      );
      expect(fits, `${width}px ${hash}`).toBe(true);
    }
  }
  expect(errors).toEqual([]);
  await page.goto("/");
  await page.screenshot({ path: "/tmp/start-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.screenshot({ path: "/tmp/start-mobile.png", fullPage: true });
});

test("unavailable storage keeps app usable and warns about memory-only changes", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Storage full", "QuotaExceededError");
    };
  });
  await create(page, "Начать заниматься спортом");
  await expect(page.getByRole("alert")).toContainText("только в памяти");
  await expect(page.getByRole("checkbox")).toHaveCount(5);
});

test("keyboard pause, clock changes and modal focus remain safe", async ({
  page,
}) => {
  await page.clock.install();
  await create(page);
  await start(page);
  await page.locator("body").click({ position: { x: 5, y: 5 } });
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("button", { name: "Продолжить", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("button", { name: "Пауза", exact: true }),
  ).toBeVisible();
  const time = await page.evaluate(() => Date.now());
  await page.clock.setSystemTime(time - 60000);
  await page.clock.runFor(500);
  await expect(
    page.getByRole("button", { name: "Продолжить", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("время");
  await page.getByRole("button", { name: "Завершить раньше" }).click();
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(
        () => document.activeElement?.closest("dialog") !== null,
      ),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Завершить раньше" }),
  ).toBeFocused();
});

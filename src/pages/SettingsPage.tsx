import { useRef, useState } from "react";
import {
  Download,
  Laptop,
  Moon,
  ShieldCheck,
  Sun,
  Trash2,
  Upload,
  Volume2,
} from "lucide-react";
import { Confirm, PageHeading } from "../components/ui";
import { useAppData } from "../hooks/useAppData";
import {
  download,
  emptyData,
  getBroken,
  replace,
  update,
} from "../lib/storage";
import { parseData } from "../lib/validation";
import { durations } from "../types";
import type { AppData, Settings } from "../types";
import { prepareSound, playSound } from "../lib/sound";
export function SettingsPage() {
  const data = useAppData();
  const [reset, setReset] = useState(false);
  const [pending, setPending] = useState<AppData | null>(null);
  const [message, setMessage] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const change = (settings: Partial<Settings>) =>
    void update((d) => ({ ...d, settings: { ...d.settings, ...settings } }));
  return (
    <>
      <PageHeading
        eyebrow="ТАК, КАК УДОБНО ТЕБЕ"
        title="Настройки"
        text="Немного личного пространства."
      />
      <section className="card settings-card">
        <h2>Твой комфорт</h2>
        <div className="setting-row">
          <div>
            <h3>Тема интерфейса</h3>
            <p>Выбери приятное для глаз оформление.</p>
          </div>
          <div className="segmented theme-picker">
            {[
              ["light", "Светлая", Sun],
              ["dark", "Тёмная", Moon],
              ["system", "Системная", Laptop],
            ].map(([value, label, Icon]) => {
              const I = Icon as typeof Sun;
              return (
                <button
                  key={String(value)}
                  aria-pressed={data.settings.theme === value}
                  onClick={() => change({ theme: value as Settings["theme"] })}
                >
                  <I size={17} />
                  {String(label)}
                </button>
              );
            })}
          </div>
        </div>
        <div className="setting-row">
          <div>
            <h3>Звук завершения таймера</h3>
            <p>Тихий сигнал, когда время истекло.</p>
          </div>
          <button
            className="switch"
            role="switch"
            aria-checked={data.settings.soundEnabled}
            aria-label="Звук завершения таймера"
            onClick={() => {
              if (!data.settings.soundEnabled) {
                prepareSound();
                setTimeout(playSound, 100);
              }
              change({ soundEnabled: !data.settings.soundEnabled });
            }}
          >
            <span />
          </button>
        </div>
        <div className="setting-row">
          <div>
            <h3>Стандартная длительность</h3>
            <p>Для новых сессий в разделе «Фокус».</p>
          </div>
          <select
            aria-label="Стандартная длительность"
            value={data.settings.defaultDurationMinutes}
            onChange={(e) =>
              change({
                defaultDurationMinutes: Number(
                  e.target.value,
                ) as Settings["defaultDurationMinutes"],
              })
            }
          >
            {durations.map((n) => (
              <option key={n} value={n}>
                {n} минут
              </option>
            ))}
          </select>
        </div>
        <p className="small muted sound-note">
          <Volume2 size={14} />
          Браузер может ограничивать звук в фоновой вкладке.
        </p>
      </section>
      <section className="card settings-card">
        <h2>Твои данные</h2>
        <div className="privacy-note">
          <ShieldCheck size={25} />
          <p>
            Твои задачи хранятся только в этом браузере. Для переноса на другое
            устройство используй экспорт данных.
          </p>
        </div>
        <div className="setting-row">
          <div>
            <h3>Резервная копия</h3>
            <p>Все задачи, сессии и настройки в одном JSON-файле.</p>
          </div>
          <button
            className="button secondary"
            onClick={() =>
              download(
                JSON.stringify(data, null, 2),
                `start-${new Date().toISOString().slice(0, 10)}.json`,
              )
            }
          >
            <Download size={17} />
            Скачать мои данные
          </button>
        </div>
        <div className="setting-row">
          <div>
            <h3>Восстановление данных</h3>
            <p>Импорт заменит текущие данные. Сначала сохрани копию.</p>
          </div>
          <button
            className="button secondary"
            disabled={!!data.activeTimer}
            onClick={() => file.current?.click()}
          >
            <Upload size={17} />
            Импортировать JSON
          </button>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const selected = e.target.files?.[0];
              e.target.value = "";
              if (!selected) return;
              try {
                if (selected.size > 10 * 1024 * 1024) throw new Error();
                const parsed = parseData(await selected.text());
                setPending(parsed);
                setMessage("");
              } catch {
                setMessage(
                  "Не удалось прочитать файл. Нужен корректный экспорт START версии 1 размером до 10 МБ.",
                );
              }
            }}
          />
        </div>
        {data.activeTimer && (
          <p className="small muted">
            Перед импортом или сбросом заверши текущую фокус-сессию.
          </p>
        )}
        {message && (
          <p role="status" className="inline-message">
            {message}
          </p>
        )}
        {getBroken() && (
          <button
            className="button secondary"
            onClick={() => download(getBroken()!, "start-recovery-raw.json")}
          >
            <Download size={17} />
            Скачать исходные повреждённые данные
          </button>
        )}
        <div className="setting-row danger-zone">
          <div>
            <h3>Начать с чистого листа</h3>
            <p>Удалить задачи, историю и настройки START.</p>
          </div>
          <button
            className="button danger-outline"
            disabled={!!data.activeTimer}
            onClick={() => setReset(true)}
          >
            <Trash2 size={17} />
            Удалить все мои данные
          </button>
        </div>
      </section>
      <p className="settings-footer">
        START 1.0 · Без аккаунтов. Без трекеров. В твоём темпе.
      </p>
      {reset && (
        <Confirm
          title="Удалить все мои данные?"
          description="Все задачи, история сессий и настройки будут удалены. Это действие нельзя отменить."
          onClose={() => setReset(false)}
          onConfirm={async () => {
            if (await replace(emptyData()))
              setMessage("Данные START удалены. Можно начать заново.");
          }}
        />
      )}
      {pending && (
        <Confirm
          title="Заменить текущие данные?"
          description={`В файле ${pending.tasks.length} задач и ${pending.sessions.length} сессий. Текущие данные будут заменены данными из файла.`}
          label="Заменить данные"
          onClose={() => setPending(null)}
          onConfirm={async () => {
            if (await replace(pending)) setMessage("Данные восстановлены.");
          }}
        />
      )}
    </>
  );
}

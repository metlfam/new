import { useEffect, useState } from "react";
import { useAppData } from "./useAppData";
import { finish, pause, remaining } from "../lib/timer";
import { getSnapshot, notify, update } from "../lib/storage";
import { playSound } from "../lib/sound";
export function useFocusTimer() {
  const data = useAppData();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    let wall = Date.now(),
      mono = performance.now();
    const tick = () => {
      const current = Date.now(),
        perf = performance.now(),
        d = getSnapshot();
      // A backwards wall-clock jump cannot be normal elapsed time. Pause conservatively.
      if (d.activeTimer?.endsAt && current < wall - 2000) {
        const left = remaining(d, wall);
        void update((s) => pause(s, current, left));
        notify(
          "Системное время изменилось. Таймер поставлен на паузу — продолжи, когда будешь готов.",
        );
      } else if (
        d.activeTimer?.endsAt &&
        Math.abs(current - wall - (perf - mono)) > 5000 &&
        document.visibilityState === "visible"
      ) {
        void update((s) => pause(s, current, remaining(d, wall)));
        notify(
          "Изменилось системное время. Таймер на паузе, чтобы сохранить корректный результат.",
        );
      } else if (d.activeTimer?.endsAt && remaining(d, current) <= 0) {
        const sessionId = d.activeTimer.sessionId;
        void update((s) => {
          const next = finish(s, sessionId, false, current);
          if (next !== s) {
            if (s.settings.soundEnabled) playSound();
            location.hash = `/focus/result/${sessionId}`;
          }
          return next;
        });
      }
      wall = current;
      mono = perf;
      setNow(current);
    };
    const interval = setInterval(tick, 250);
    tick();
    return () => clearInterval(interval);
  }, []);
  return {
    left: remaining(data, now),
    session: data.sessions.find((s) => s.id === data.activeTimer?.sessionId),
  };
}

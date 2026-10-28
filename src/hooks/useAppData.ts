import { useSyncExternalStore } from "react";
import { getSnapshot, subscribe } from "../lib/storage";
export const useAppData = () => useSyncExternalStore(subscribe, getSnapshot);

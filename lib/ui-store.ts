import { useSyncExternalStore } from "react";

export interface UiState {
  view: "3d" | "2d";
  /** Bumped to ask the camera to show the whole campus. */
  recenter: number;
  /** Screen space the panel covers: desktop on the left, phone at the bottom. */
  insets: { left: number; bottom: number };
}

let state: UiState = {
  view: "3d",
  recenter: 0,
  insets: { left: 0, bottom: 0 },
};
const listeners = new Set<() => void>();

export function getUi(): UiState {
  return state;
}

export function setUi(patch: Partial<UiState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

export function subscribeUi(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useUi<T>(select: (state: UiState) => T): T {
  return useSyncExternalStore(
    subscribeUi,
    () => select(state),
    () => select(state),
  );
}

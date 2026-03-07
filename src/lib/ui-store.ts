"use client";

import { create } from "zustand";

export type WindowMode = "normal" | "maximized" | "minimized";

export type CursorState = {
  clicking: boolean;
  visible: boolean;
  x: number;
  y: number;
};

type PortfolioUiState = {
  activeProjectId: string | null;
  cursorState: CursorState;
  isGuideActive: boolean;
  windowMode: WindowMode;
  closeProjectWindow: () => void;
  maximizeProjectWindow: () => void;
  minimizeProjectWindow: () => void;
  openProjectWindow: (projectId: string) => void;
  resetPointer: () => void;
  restoreProjectWindow: () => void;
  setCursorState: (cursorState: CursorState | ((current: CursorState) => CursorState)) => void;
  setGuideActive: (isGuideActive: boolean) => void;
};

const initialCursorState: CursorState = {
  clicking: false,
  visible: false,
  x: 72,
  y: 360,
};

export const usePortfolioUiStore = create<PortfolioUiState>((set) => ({
  activeProjectId: null,
  cursorState: initialCursorState,
  isGuideActive: false,
  windowMode: "normal",
  closeProjectWindow: () =>
    set({
      activeProjectId: null,
      windowMode: "normal",
    }),
  maximizeProjectWindow: () =>
    set((current) => ({
      windowMode: current.windowMode === "maximized" ? "normal" : "maximized",
    })),
  minimizeProjectWindow: () =>
    set({
      windowMode: "minimized",
    }),
  openProjectWindow: (projectId) =>
    set({
      activeProjectId: projectId,
      windowMode: "normal",
    }),
  resetPointer: () =>
    set({
      cursorState: initialCursorState,
      isGuideActive: false,
    }),
  restoreProjectWindow: () =>
    set({
      windowMode: "normal",
    }),
  setCursorState: (cursorState) =>
    set((current) => ({
      cursorState: typeof cursorState === "function" ? cursorState(current.cursorState) : cursorState,
    })),
  setGuideActive: (isGuideActive) =>
    set({
      isGuideActive,
    }),
}));
